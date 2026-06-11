import * as vscode from 'vscode';
import { fetchCompletion } from './llmClient';
import { getConfig } from './config';

type StatusCallback = (state: 'loading' | 'idle' | 'error', message?: string) => void;

export class CompletionProvider implements vscode.InlineCompletionItemProvider {
  private pendingTimer: ReturnType<typeof setTimeout> | undefined;
  private pendingResolve: (() => void) | undefined;
  private readonly outputChannel: vscode.OutputChannel;
  private readonly onStatusChange: StatusCallback;

  constructor(outputChannel: vscode.OutputChannel, onStatusChange: StatusCallback) {
    this.outputChannel = outputChannel;
    this.onStatusChange = onStatusChange;
  }

  async provideInlineCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _context: vscode.InlineCompletionContext,
    token: vscode.CancellationToken
  ): Promise<vscode.InlineCompletionItem[] | null> {
    const cfg = getConfig();
    if (!cfg.enabled) {
      return null;
    }

    // Cancel any previous pending debounce
    if (this.pendingTimer !== undefined) {
      clearTimeout(this.pendingTimer);
      this.pendingTimer = undefined;
    }
    if (this.pendingResolve !== undefined) {
      this.pendingResolve();
      this.pendingResolve = undefined;
    }

    // Wait for debounce period; resolves true = timer fired, false = cancelled
    const fired = await new Promise<boolean>(resolve => {
      const onCancel = token.onCancellationRequested(() => {
        clearTimeout(this.pendingTimer);
        this.pendingTimer = undefined;
        this.pendingResolve = undefined;
        onCancel.dispose();
        resolve(false);
      });

      this.pendingResolve = () => {
        onCancel.dispose();
        resolve(false);
      };

      this.pendingTimer = setTimeout(() => {
        this.pendingTimer = undefined;
        this.pendingResolve = undefined;
        onCancel.dispose();
        resolve(true);
      }, cfg.debounceMs);
    });

    if (!fired || token.isCancellationRequested) {
      return null;
    }

    const prefix = this.extractPrefix(document, position, cfg.maxPrefixChars);
    if (!prefix.trim()) {
      return null;
    }

    const controller = new AbortController();
    const abortDisposable = token.onCancellationRequested(() => controller.abort());

    this.onStatusChange('loading');
    try {
      const text = await fetchCompletion(prefix, controller.signal);
      if (!text || token.isCancellationRequested) {
        return null;
      }
      return [new vscode.InlineCompletionItem(text)];
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return null;
      }
      const msg = err instanceof Error ? err.message : String(err);
      this.outputChannel.appendLine(`[${new Date().toISOString()}] Error: ${msg}`);
      this.onStatusChange('error', msg);
      return null;
    } finally {
      abortDisposable.dispose();
      this.onStatusChange('idle');
    }
  }

  private extractPrefix(
    document: vscode.TextDocument,
    position: vscode.Position,
    maxChars: number
  ): string {
    const fullRange = new vscode.Range(new vscode.Position(0, 0), position);
    let text = document.getText(fullRange);

    if (text.length > maxChars) {
      text = text.slice(text.length - maxChars);
    }

    // Replace minified/generated lines (>500 chars) with blank lines
    return text
      .split('\n')
      .map(line => (line.length > 500 ? '' : line))
      .join('\n');
  }
}
