import { window, workspace, type Disposable, type TextEditor } from 'vscode';
import { Command } from '../../types';
import { readJsonc, writeJsonc } from '../../utils/file-system';
import { getCommandId } from '../../utils/get-command-id';
import {
  extractVariablesFromSelection,
  type LocaleVariableMatch,
} from './extract-variables-from-selection';
import { replaceVariablesInSelection } from './replace-variables-in-selection';

interface Locale {
  [key: string]: Locale | string;
}

async function getDefaultLocaleFile() {
  const files = await workspace.findFiles('**/locales/*.default.json');
  const uri = files.at(0);

  if (!uri) {
    throw new Error('Cannot find default locale file');
  }

  const { content, data } = await readJsonc(uri, workspace.fs);

  return {
    data,
    string: content,
    uri,
  };
}

function buildTranslateFilter(variables: LocaleVariableMatch[]) {
  if (variables.length === 0) {
    return 't';
  }

  return `t: ${variables.map(({ variableName, variableValue }) => `${variableName}: ${variableValue}`).join(', ')}`;
}

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

function wrap(prefix: string, suffix = prefix) {
  return function (string: string) {
    return `${prefix}${string}${suffix}`;
  };
}

function translate(key: string, variables: LocaleVariableMatch[]) {
  const quote = key.includes(`'`) ? `"` : `'`;
  return `{{ ${wrap(quote)(key)} | ${buildTranslateFilter(variables)} }}`;
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
        console.log('Cancelled');
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
      name: getCommandId('extractToLocales'),
    },
  },
);
