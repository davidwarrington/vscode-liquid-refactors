import { type FileSystem, workspace } from 'vscode';
import { readJsonc, writeJsonc } from './file-system';

async function getJson(glob: string, notFoundError: string, fs: FileSystem) {
  const files = await workspace.findFiles(glob);
  const uri = files.at(0);

  if (!uri) {
    throw new Error(notFoundError);
  }

  const { content, data } = await readJsonc(uri, workspace.fs);

  function update(data: unknown) {
    if (!uri) {
      throw new Error('URI not found, file cannot be updated.');
    }

    return writeJsonc(uri, content, data, fs);
  }

  return {
    data,
    update,
  };
}

export async function getDefaultLocaleFile(fs: FileSystem) {
  return await getJson(
    '**/locales/*.default.json',
    'Cannot find default locale file',
    fs,
  );
}

export async function getDefaultSchemaLocaleFile(fs: FileSystem) {
  return await getJson(
    '**/locales/*.default.schema.json',
    'Cannot find default schema locale file',
    fs,
  );
}
