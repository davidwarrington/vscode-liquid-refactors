import {
  window,
  type CodeAction,
  type Command,
  type ProviderResult,
} from 'vscode';
import { extractToBlockSetting } from '../commands/extract-to-block-setting';
import { extractToLocales } from '../commands/extract-to-locales';
import { extractToSchemaSetting } from '../commands/extract-to-schema-setting';
import { renameLocaleVariable } from '../commands/rename-locale-variable';
import type { CodeActionProvider } from '../types';

export class LiquidCodeActionProvider implements CodeActionProvider {
  get selector() {
    return 'liquid';
  }

  provideCodeActions(): ProviderResult<(CodeAction | Command)[]> {
    const editor = window.activeTextEditor;

    if (!editor) {
      return [];
    }

    return [
      extractToLocales,
      extractToSchemaSetting,
      extractToBlockSetting,
      renameLocaleVariable,
    ]
      .map(command => {
        const isAvailable = command.meta.isAvailable(editor);

        if (!isAvailable) {
          return;
        }

        return {
          command: command.meta.id,
          title: command.meta.title,
        };
      })
      .filter(command => command !== undefined);
  }
}
