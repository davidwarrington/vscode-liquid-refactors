import { patch } from 'silver-fleece';
import { Range, window, type Disposable, type TextEditor } from 'vscode';
import type { Command, Locale } from '../../types';
import { getCommandId } from '../../utils/get-command-id';
import {
  getLocales,
  getSchema,
  SchemaError,
  type MatchedSchema,
} from '../../utils/get-schema';
import { isSection } from '../../utils/is-section';
import { rangeBuilder } from '../../utils/range-builder';
import {
  extractVariablesFromSelection,
  replaceVariablesInSelection,
  translate,
  type LocaleVariableMatch,
} from '../../utils/translate';

function injectLocale(
  key: string,
  value: string,
  base: Locale,
  variables: LocaleVariableMatch[],
): Locale {
  const [firstKey, ...remainingKeys] = key.split('.');

  if (firstKey in base && remainingKeys.length === 0) {
    throw new Error('Key already exists');
  }

  const nextObject = base[firstKey] ?? {};

  if (typeof nextObject !== 'object') {
    // eslint-disable-next-line unicorn/prefer-type-error
    throw new Error('Key already exists');
  }

  if (remainingKeys.length > 0) {
    return {
      ...base,
      [firstKey]: injectLocale(
        remainingKeys.join('.'),
        value,
        nextObject,
        variables,
      ),
    };
  }

  base[key] = replaceVariablesInSelection(value, variables);

  return base;
}

function injectSectionLocale(
  schema: MatchedSchema,
  key: string,
  value: string,
  variables: LocaleVariableMatch[],
) {
  const { data } = schema;

  const locales = getLocales(data) ?? {};

  if (Object.keys(locales).length === 0) {
    locales.en = {};
  }

  if (!locales) {
    throw new Error('[extract-to-section-locales] invalid section locales');
  }

  for (const locale in locales) {
    locales[locale] = injectLocale(
      key,
      value,
      locales[locale] ?? {},
      variables,
    ) as Record<string, Locale>;
  }

  data.locales = locales;

  return schema.match.replace(schema.content, patch(schema.content, data));
}

export const extractToSectionLocales: Command = Object.assign(
  async function extractToSectionLocales(
    editor: TextEditor,
  ): Promise<Disposable | void> {
    try {
      if (editor.selection.isEmpty) {
        throw new Error('Cannot refactor empty string.');
      }

      const schema = getSchema(editor.document.getText());
      const highlightedText = editor.document.getText(editor.selection);

      const key = await window.showInputBox({
        /** @todo replace with highlighted text */
        placeHolder: 'key.for.locale',
      });

      const isCancelled = key === undefined;

      if (isCancelled) {
        console.log('[extract-to-section-locales] Cancelled');
        return;
      }

      if (key === '') {
        throw new Error('Key must not be blank');
      }

      const start = editor.document.positionAt(schema.position.start);
      const end = editor.document.positionAt(schema.position.end);

      const variables = extractVariablesFromSelection(highlightedText);
      const newSchema = injectSectionLocale(
        schema,
        key,
        highlightedText,
        variables,
      );

      editor.edit(edit => {
        edit.replace(editor.selection, translate(key, variables));
        edit.replace(new Range(start, end), newSchema);
      });
    } catch (error) {
      if (error instanceof Error) {
        window.showErrorMessage(error.message);
      }

      throw error;
    }
  },
  {
    meta: {
      title: 'Extract to section locales',
      id: getCommandId('extractToSectionLocales'),
      isAvailable(editor: TextEditor) {
        try {
          const schema = getSchema(editor.document.getText());

          const rangeAt = rangeBuilder(editor);
          const schemaContainsSelection = rangeAt(
            schema.position.start,
            schema.position.end,
          ).contains(editor.selection);

          return (
            isSection(editor.document.uri) &&
            !editor.selection.isEmpty &&
            !schemaContainsSelection
          );
        } catch (error) {
          if (error instanceof SchemaError) {
            return false;
          }
          throw error;
        }
      },
    },
  },
);
