import { commands, type ExtensionContext } from 'vscode';
import { name as extensionName } from '../package.json';
import { extractToLocales } from './commands/extract-to-locales';

type Commands = typeof commands;
type RegisterTextEditorCommandArgs = Parameters<
  Commands['registerTextEditorCommand']
>;

function registerSubscription(context: ExtensionContext) {
  return {
    textEditorCommand(...[name, ...args]: RegisterTextEditorCommandArgs) {
      const commandName = `${extensionName}.${name}`;
      const disposable = commands.registerTextEditorCommand(
        commandName,
        ...args,
      );

      context.subscriptions.push(disposable);
    },
  };
}

export function activate(context: ExtensionContext) {
  const subscribe = registerSubscription(context);

  subscribe.textEditorCommand('extractToLocales', extractToLocales);
}

export function deactivate() {}
