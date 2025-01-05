import {
  type CodeAction,
  type CodeActionProvider,
  type Command,
  type DocumentSelector,
  type ProviderResult,
  window,
} from 'vscode';
import { extractToLocales } from '../commands/extract-to-locales';

export class LiquidCodeActionProvider implements CodeActionProvider {
  static selector: DocumentSelector = 'liquid';

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
    ];
  }
}
