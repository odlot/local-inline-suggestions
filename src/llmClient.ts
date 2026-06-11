import { getConfig } from './config';

interface CompletionRequest {
  model: string;
  prompt: string;
  max_tokens: number;
  temperature: number;
  stop: string[];
  stream: false;
}

interface CompletionResponse {
  choices: Array<{ text: string }>;
}

export async function fetchCompletion(
  prompt: string,
  signal: AbortSignal
): Promise<string> {
  const cfg = getConfig();

  if (!cfg.endpointUrl) {
    throw new Error('localInlineSuggestions.endpointUrl is not configured');
  }

  const url = `${cfg.endpointUrl.replace(/\/$/, '')}/v1/completions`;

  const body: CompletionRequest = {
    model:       cfg.model,
    prompt,
    max_tokens:  cfg.maxTokens,
    temperature: cfg.temperature,
    stop:        ['\n\n', '\n```'],
    stream:      false,
  };

  const response = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`HTTP ${response.status}: ${text.slice(0, 200)}`);
  }

  const data = (await response.json()) as CompletionResponse;
  return data?.choices?.[0]?.text ?? '';
}
