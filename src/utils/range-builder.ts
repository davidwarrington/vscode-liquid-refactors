import { Range, type TextEditor } from 'vscode';

export function rangeBuilder(editor: TextEditor) {
  const { document } = editor;

  return function rangeAt(start: number, end: number) {
    return new Range(document.positionAt(start), document.positionAt(end));
  };
}
