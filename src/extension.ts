import * as vscode from 'vscode';
import { CompletionProvider } from './completionProvider';
import { getConfig } from './config';

export function activate(context: vscode.ExtensionContext): void {
  const outputChannel = vscode.window.createOutputChannel('Local Inline Suggestions');
  context.subscriptions.push(outputChannel);

  const statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );
  statusBar.command = 'local-inline-suggestions.toggle';
  context.subscriptions.push(statusBar);

  let lastError: string | undefined;
  let fetchCount = 0;

  function updateStatusBar(): void {
    const cfg = getConfig();
    if (!cfg.enabled) {
      statusBar.text    = '$(circle-slash) LIS';
      statusBar.tooltip = 'Local Inline Suggestions: disabled — click to enable';
      statusBar.color   = new vscode.ThemeColor('statusBarItem.warningForeground');
    } else if (fetchCount > 0) {
      statusBar.text    = '$(loading~spin) LIS';
      statusBar.tooltip = 'Local Inline Suggestions: fetching…';
      statusBar.color   = undefined;
    } else {
      statusBar.text    = '$(sparkle) LIS';
      statusBar.tooltip = lastError
        ? `Local Inline Suggestions: last error — ${lastError} (click to toggle)`
        : 'Local Inline Suggestions: enabled — click to disable';
      statusBar.color   = undefined;
    }
    statusBar.show();
  }

  const provider = new CompletionProvider(outputChannel, (state, message) => {
    if (state === 'loading') {
      lastError = undefined;
      fetchCount++;
    } else if (state === 'idle') {
      fetchCount = Math.max(0, fetchCount - 1);
    } else if (state === 'error') {
      lastError = message;
      fetchCount = Math.max(0, fetchCount - 1);
    }
    updateStatusBar();
  });

  const selector: vscode.DocumentSelector = { pattern: '**/*' };
  context.subscriptions.push(
    vscode.languages.registerInlineCompletionItemProvider(selector, provider)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('local-inline-suggestions.toggle', async () => {
      const cfg = getConfig();
      await vscode.workspace.getConfiguration('localInlineSuggestions')
        .update('enabled', !cfg.enabled, vscode.ConfigurationTarget.Global);
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('localInlineSuggestions')) {
        lastError = undefined;
        updateStatusBar();
      }
    })
  );

  updateStatusBar();
}

export function deactivate(): void {
  // VS Code disposes context.subscriptions automatically.
}
