import type * as vscode from 'vscode';

type TextEditorCommand = Parameters<
  typeof vscode.commands.registerTextEditorCommand
>[1];

export interface Command extends TextEditorCommand {
  meta: {
    name: string;
  };
}

export interface CodeActionProvider extends vscode.CodeActionProvider {
  selector: vscode.DocumentSelector;
}
