import { Range, window, type Disposable, type TextEditor } from 'vscode';
import type { Command } from '../../types';
import { getCommandId } from '../../utils/get-command-id';
import { getSchema, SchemaError } from '../../utils/get-schema';
import { isSection } from '../../utils/is-section';
import { rangeBuilder } from '../../utils/range-builder';
import {
  extractVariablesFromSelection,
  translate,
} from '../../utils/translate';
import { injectSectionLocale } from './inject-section-locale';

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
