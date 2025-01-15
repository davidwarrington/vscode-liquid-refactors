import type { LiquidNamedArgument } from '@shopify/liquid-html-parser';
import {
  Range,
  window,
  workspace,
  type Disposable,
  type TextEditor,
} from 'vscode';
import { parseTranslateTag } from './parse-translate-tag';
import type { Command, Locale } from '../../types';
import { writeJsonc } from '../../utils/file-system';
import { getCommandId } from '../../utils/get-command-id';
import { getDefaultLocaleFile } from '../../utils/locales';

function rangeBuilder(editor: TextEditor) {
  const { document } = editor;

  return function rangeAt(start: number, end: number) {
    return new Range(document.positionAt(start), document.positionAt(end));
  };
}

function getCurrentTranslateTag(editor: TextEditor) {
  const { document } = editor;
  const rangeAt = rangeBuilder(editor);
  const file = document.getText();

  const translateTags = file.matchAll(
    /{{-?\s*(?:'([^']*)'|"([^"]*)")\s*\|\s*t:\s*.*?\s*-?}}/gs,
  );

  const currentTag = translateTags.find(match => {
    const { 0: text, index: start } = match;
    const end = start + text.length;
    const range = rangeAt(start, end);

    return range.contains(editor.selection);
  });

  if (!currentTag) {
    return;
  }

  const { parameters } = parseTranslateTag(currentTag[0]);
  const selectionRange = new Range(
    editor.selection.start,
    editor.selection.end,
  );
  const offset = currentTag.index;

  const currentArgument = parameters.find(
    (parameter): parameter is LiquidNamedArgument => {
      if (parameter.type !== 'NamedArgument') {
        return false;
      }

      const { name, position } = parameter;
      const start = position.start + offset;
      const end = start + name.length;

      return rangeAt(start, end).contains(selectionRange);
    },
  );

  if (!currentArgument) {
    return;
  }

  return {
    argument: {
      name: currentArgument.name,
      range: rangeAt(
        currentArgument.position.start + offset,
        currentArgument.position.start + offset + currentArgument.name.length,
      ),
    },
    localeKey: currentTag[1],
  };
}

function modifyLocaleVariable(
  locales: Locale,
  keys: string[],
  oldValue: string,
  newValue: string,
): Locale {
  const [key, ...remainingKeys] = keys;
  const isLastKey = remainingKeys.length === 0;

  if (!(key in locales)) {
    throw new Error('Cannot find locale to edit');
  }

  if (isLastKey) {
    if (typeof locales[key] !== 'string') {
      throw new TypeError('Locale must be a string');
    }

    return {
      ...locales,
      [key]: locales[key].replaceAll(
        new RegExp(`{{\\s*${oldValue}\\s*}}`, 'g'),
        `{{ ${newValue} }}`,
      ),
    };
  }

  if (typeof locales[key] !== 'object') {
    throw new TypeError('Locale must be a string');
  }

  return {
    ...locales,
    [key]: modifyLocaleVariable(
      locales[key],
      remainingKeys,
      oldValue,
      newValue,
    ),
  };
}

export const renameLocaleVariable = Object.assign(
  async function renameLocaleVariable(
    editor: TextEditor,
  ): Promise<Disposable | void> {
    try {
      const currentTag = getCurrentTranslateTag(editor);

      if (!currentTag) {
        throw new Error(
          `Cannnot find the translate variable you're trying to edit`,
        );
      }

      if (!currentTag.argument) {
        throw new Error('You must select a translate argument');
      }

      const {
        data,
        string: localeString,
        uri: localeFile,
      } = await getDefaultLocaleFile();

      const name = await window.showInputBox({
        placeHolder: 'name',
      });

      const isCancelled = name === undefined;

      if (isCancelled) {
        console.log('[rename-locale-variable] Cancelled');
        return;
      }

      if (name === '') {
        throw new Error('Key must not be blank');
      }

      const replacementLocales = modifyLocaleVariable(
        data,
        currentTag.localeKey.split('.'),
        currentTag.argument.name,
        name,
      );

      await editor.edit(async edit => {
        edit.replace(currentTag.argument.range, name);

        await writeJsonc(
          localeFile,
          localeString,
          replacementLocales,
          workspace.fs,
        );
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
      name: getCommandId('renameLocaleVariable'),
      isAvailable(editor: TextEditor | undefined) {
        if (!editor) {
          return false;
        }

        const tag = getCurrentTranslateTag(editor);

        return Boolean(tag);
      },
    },
  },
) satisfies Command;
