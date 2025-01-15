import { workspace } from 'vscode';
import { readJsonc } from './file-system';

export async function getDefaultLocaleFile() {
  const files = await workspace.findFiles('**/locales/*.default.json');
  const uri = files.at(0);

  if (!uri) {
    throw new Error('Cannot find default locale file');
  }

  const { content, data } = await readJsonc(uri, workspace.fs);

  return {
    data,
    string: content,
    uri,
  };
}
