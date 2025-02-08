import { window, workspace, type Disposable, type TextEditor } from 'vscode';
import type { Command } from '../../types';
import { writeJsonc } from '../../utils/file-system';
import { getCommandId } from '../../utils/get-command-id';
import { getDefaultLocaleFile } from '../../utils/locales';
import {
  extractVariablesFromSelection,
  replaceVariablesInSelection,
  translate,
} from '../../utils/translate';
import { injectLocale } from '../../utils/inject-locale';

export const extractToLocales: Command = Object.assign(
  async function extractToLocales(
    editor: TextEditor,
  ): Promise<Disposable | void> {
    try {
      if (editor.selection.isEmpty) {
        throw new Error('Cannot refactor empty string.');
      }

      const {
        data,
        string: localeString,
        uri: localeFile,
      } = await getDefaultLocaleFile();
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

      const variables = extractVariablesFromSelection(highlightedText);
      const translationValue = replaceVariablesInSelection(
        highlightedText,
        variables,
      );
      const newLocales = injectLocale(data, key.split('.'), translationValue);

      await editor.edit(async edit => {
        edit.replace(editor.selection, translate(key, variables));
        await writeJsonc(localeFile, localeString, newLocales, workspace.fs);
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
      title: 'Extract to locales',
      id: getCommandId('extractToLocales'),
      isAvailable(editor: TextEditor) {
        return !editor.selection.isEmpty;
      },
    },
  },
);
