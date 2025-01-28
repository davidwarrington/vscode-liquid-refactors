import { type Uri } from 'vscode';

export function isSection(uri: Uri) {
  const parts = uri.path.split('/');
  return parts.at(-2) === 'sections';
}
