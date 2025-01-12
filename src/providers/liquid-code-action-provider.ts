import {
  window,
  type CodeAction,
  type Command,
  type ProviderResult,
} from 'vscode';
import { extractToLocales } from '../commands/extract-to-locales';
import { extractToSchemaSetting } from '../commands/extract-to-schema-setting';
import { CodeActionProvider } from '../types';

export class LiquidCodeActionProvider implements CodeActionProvider {
  get selector() {
    return 'liquid';
  }

  provideCodeActions(): ProviderResult<(CodeAction | Command)[]> {
    const editor = window.activeTextEditor;

    if (!editor || editor.selection.isEmpty) {
      return [];
    }

    return [
      {
        command: extractToLocales.meta.name,
        title: 'Extract to locales',
      },
      {
        command: extractToSchemaSetting.meta.name,
        title: 'Extract to schema setting',
      },
    ];
  }
}
