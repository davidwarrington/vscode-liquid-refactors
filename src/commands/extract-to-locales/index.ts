import { window, workspace, type Disposable, type TextEditor } from 'vscode';
import type { Command, Locale } from '../../types';
import { writeJsonc } from '../../utils/file-system';
import { getCommandId } from '../../utils/get-command-id';
import { getDefaultLocaleFile } from '../../utils/locales';
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
      const newLocales = injectLocale(key, highlightedText, data, variables);

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
