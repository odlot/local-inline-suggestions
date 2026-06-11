import * as vscode from 'vscode';

export interface ExtensionConfig {
  enabled: boolean;
  endpointUrl: string;
  model: string;
  maxTokens: number;
  temperature: number;
  debounceMs: number;
  maxPrefixChars: number;
}

export function getConfig(): ExtensionConfig {
  const cfg = vscode.workspace.getConfiguration('localInlineSuggestions');
  return {
    enabled:        cfg.get<boolean>('enabled', true),
    endpointUrl:    cfg.get<string>('endpointUrl', 'http://localhost:11434'),
    model:          cfg.get<string>('model', 'codellama:7b'),
    maxTokens:      cfg.get<number>('maxTokens', 100),
    temperature:    cfg.get<number>('temperature', 0.2),
    debounceMs:     cfg.get<number>('debounceMs', 350),
    maxPrefixChars: cfg.get<number>('maxPrefixChars', 8000),
  };
}
