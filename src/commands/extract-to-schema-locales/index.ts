import { window, workspace, type Disposable, type TextEditor } from 'vscode';
import type { Command } from '../../types';
import { getCommandId } from '../../utils/get-command-id';
import { getDefaultSchemaLocaleFile } from '../../utils/locales';
import { getSchema } from '../../utils/get-schema';
import { injectLocale } from '../../utils/inject-locale';
import { rangeBuilder } from '../../utils/range-builder';

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
        console.log('[extract-to-schema-locales] Cancelled');
        return;
      }

      if (key === '') {
        throw new Error('Key must not be blank');
      }

      const newLocales = injectLocale(
        locales.data,
        key.split('.'),
        highlightedText,
      );

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
        const schema = getSchema(editor.document.getText());
        const range = rangeAt(schema.position.start, schema.position.end);

        /** @todo check if cursor is at valid json property */
        return range.contains(editor.selection);
      },
    },
  },
);
