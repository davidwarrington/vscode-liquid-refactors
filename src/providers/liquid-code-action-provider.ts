import {
  window,
  type CodeAction,
  type Command,
  type ProviderResult,
} from 'vscode';
import { extractToBlockSetting } from '../commands/extract-to-block-setting';
import { extractToLocales } from '../commands/extract-to-locales';
import { extractToSchemaSetting } from '../commands/extract-to-schema-setting';
import { CodeActionProvider } from '../types';
import { renameLocaleVariable } from '../commands/rename-locale-variable';

export class LiquidCodeActionProvider implements CodeActionProvider {
  get selector() {
    return 'liquid';
  }

  provideCodeActions(): ProviderResult<(CodeAction | Command)[]> {
    // const editor = window.activeTextEditor;

    // if (!editor || editor.selection.isEmpty) {
    //   return [];
    // }

    return [
      {
        command: extractToLocales.meta.name,
        title: 'Extract to locales',
      },
      {
        command: extractToSchemaSetting.meta.name,
        title: 'Extract to schema setting',
      },
      {
        command: extractToBlockSetting.meta.name,
        title: 'Extract to block setting',
      },
      {
        command: renameLocaleVariable.meta.name,
        title: 'Rename locale variable',
      },
    ];
  }
}
