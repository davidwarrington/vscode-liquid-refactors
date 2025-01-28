import {
  Range,
  window,
  workspace,
  type Disposable,
  type TextEditor,
} from 'vscode';
import type { Command, Locale } from '../../types';
import { getCommandId } from '../../utils/get-command-id';
import { getDefaultSchemaLocaleFile } from '../../utils/locales';
import { getSchema } from '../../utils/get-schema';

function rangeBuilder(editor: TextEditor) {
  const { document } = editor;

  return function rangeAt(start: number, end: number) {
    return new Range(document.positionAt(start), document.positionAt(end));
  };
}

function injectLocale(key: string, value: string, base: Locale): Locale {
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
      [firstKey]: injectLocale(remainingKeys.join('.'), value, nextObject),
    };
  }

  base[key] = value;

  return base;
}

export const extractToSchemaLocales: Command = Object.assign(
  async function extractToSchemaLocales(
    editor: TextEditor,
  ): Promise<Disposable | void> {
    try {
      if (editor.selection.isEmpty) {
        throw new Error('Cannot refactor empty string.');
      }

      const locales = await getDefaultSchemaLocaleFile(workspace.fs);
      const highlightedText = editor.document.getText(editor.selection);

      const key = await window.showInputBox({
        /** @todo replace with highlighted text */
        placeHolder: 'key.for.locale',
      });

      const isCancelled = key === undefined;

      if (isCancelled) {
        console.log('[extract-to-locales] Cancelled');
        return;
      }

      if (key === '') {
        throw new Error('Key must not be blank');
      }

      const newLocales = injectLocale(key, highlightedText, locales.data);

      await editor.edit(async edit => {
        edit.replace(editor.selection, key.startsWith('t:') ? key : `t:${key}`);
        await locales.update(newLocales);
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
      title: 'Extract to schema locales',
      id: getCommandId('extractToSchemaLocales'),
      isAvailable(editor: TextEditor) {
        const rangeAt = rangeBuilder(editor);
        const schema = getSchema(editor.document.getText(editor.selection));
        const range = rangeAt(schema.position.start, schema.position.end);

        /** @todo check if cursor is at valid json property */
        return range.contains(editor.selection);
      },
    },
  },
);
