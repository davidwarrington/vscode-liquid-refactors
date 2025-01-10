import { evaluate, patch } from 'silver-fleece';
import type { FileSystem, Uri } from 'vscode';

export async function writeFile(file: Uri, content: string, fs: FileSystem) {
  const buffer = Buffer.from(content);

  return fs.writeFile(file, buffer);
}

export async function writeJsonc(
  file: Uri,
  base: string,
  content: unknown,
  fs: FileSystem,
) {
  return writeFile(file, patch(base, content), fs);
}

export async function readFile(file: Uri, fs: FileSystem) {
  const buffer = await fs.readFile(file);

  return buffer.toString();
}

export async function readJsonc(file: Uri, fs: FileSystem) {
  const content = await readFile(file, fs);
  const data = evaluate(content);

  return {
    content,
    data,
  };
}
