import {
  window,
  workspace,
  type Disposable,
  type FileSystem,
  type TextEditor,
  type Uri,
} from 'vscode';

interface Locale {
  [key: string]: Locale | string;
}

async function writeFile(file: Uri, content: string, fs: FileSystem) {
  const buffer = Buffer.from(content);

  return fs.writeFile(file, buffer);
}

async function writeJson(file: Uri, content: unknown, fs: FileSystem) {
  return writeFile(file, JSON.stringify(content, undefined, 2), fs);
}

async function readFile(file: Uri, fs: FileSystem) {
  const buffer = await fs.readFile(file);

  return buffer.toString();
}

async function readJson<T = unknown>(...args: Parameters<typeof readFile>) {
  const content = await readFile(...args);

  return JSON.parse(content) as T;
}

async function getDefaultLocaleFile() {
  const files = await workspace.findFiles('**/locales/*.default.json');
  const uri = files.at(0);

  if (!uri) {
    throw new Error('Cannot find default locale file');
  }

  /** @todo parse as json5, currently assuming locale file is valid json */
  const data = await readJson<Locale>(uri, workspace.fs);

  return {
    data,
    uri,
  };
}

function injectLocale(key: string, value: string, base: Locale): Locale {
  const [firstKey, ...remainingKeys] = key.split('.');

  if (firstKey in base) {
    throw new Error('Key already exists');
  }

  const nextObject = base[firstKey] ?? {};

  if (typeof nextObject !== 'object') {
    // eslint-disable-next-line unicorn/prefer-type-error
    throw new Error('Key already exists');
  }

  if (remainingKeys.length > 0) {
    return {
      ...base,
      [firstKey]: injectLocale(remainingKeys.join('.'), value, nextObject),
    };
  }

  base[key] = value;

  return base;
}

function wrap(prefix: string, suffix = prefix) {
  return function (string: string) {
    return `${prefix}${string}${suffix}`;
  };
}

function translate(key: string) {
  const quote = key.includes(`'`) ? `"` : `'`;
  /** @todo add variables */
  return `{{ ${wrap(quote)(key)} | t }}`;
}

export async function extractToLocales(
  editor: TextEditor,
): Promise<Disposable | void> {
  if (editor.selection.isEmpty) {
    throw new Error('Cannot refactor empty string.');
  }

  const { data, uri: localeFile } = await getDefaultLocaleFile();
  const highlightedText = editor.document.getText(editor.selection);

  const key = await window.showInputBox({
    /** @todo replace with highlighted text */
    placeHolder: 'key.for.locale',
  });

  const isCancelled = key === undefined;

  if (isCancelled) {
    console.log('Cancelled');
    return;
  }

  const newLocales = injectLocale(key, highlightedText, data);

  await editor.edit(async edit => {
    edit.replace(editor.selection, translate(key));
    /** @todo maintain existing formatting */
    await writeJson(localeFile, newLocales, workspace.fs);
  });
}
