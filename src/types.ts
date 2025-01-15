import type * as vscode from 'vscode';

export interface Locale {
  [key: string]: Locale | string;
}

type TextEditorCommand = Parameters<
  typeof vscode.commands.registerTextEditorCommand
>[1];

export interface Command extends TextEditorCommand {
  meta: {
    name: string;
    isAvailable?: (editor: vscode.TextEditor | undefined) => boolean;
  };
}

export interface CodeActionProvider extends vscode.CodeActionProvider {
  selector: vscode.DocumentSelector;
}
