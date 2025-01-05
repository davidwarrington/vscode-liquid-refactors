import type { commands } from 'vscode';

type TextEditorCommand = Parameters<
  typeof commands.registerTextEditorCommand
>[1];
type TextEditorCommandArgs = Parameters<TextEditorCommand>;
type TextEditorCommandReturnType = ReturnType<TextEditorCommand>;

export interface Command {
  (...args: TextEditorCommandArgs): TextEditorCommandReturnType;
  meta: {
    name: string;
  };
}
