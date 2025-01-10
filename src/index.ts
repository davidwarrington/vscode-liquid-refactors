import { commands, languages, type ExtensionContext } from 'vscode';
import { extractToLocales } from './commands/extract-to-locales';
import { LiquidCodeActionProvider } from './providers/liquid-code-action-provider';
import type { CodeActionProvider, Command } from './types';

function registerSubscription(context: ExtensionContext) {
  return {
    codeActionsProvider(provider: CodeActionProvider) {
      const disposable = languages.registerCodeActionsProvider(
        provider.selector,
        provider,
      );

      context.subscriptions.push(disposable);
    },
    textEditorCommand(command: Command) {
      const disposable = commands.registerTextEditorCommand(
        command.meta.name,
        command,
      );

      context.subscriptions.push(disposable);
    },
  };
}

export function activate(context: ExtensionContext) {
  const subscribe = registerSubscription(context);

  subscribe.codeActionsProvider(new LiquidCodeActionProvider());
  subscribe.textEditorCommand(extractToLocales);
}

export function deactivate() {}
