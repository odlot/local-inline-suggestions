# Local Inline Suggestions

Ghost-text code completions powered by any OpenAI-compatible LLM — running locally or anywhere on your network.

## How it works

As you type, the extension waits for a brief pause (configurable debounce), then sends the text before your cursor to an LLM's `/v1/completions` endpoint and shows the result as grey ghost text. Press `Tab` to accept.

Compatible with **Ollama**, **LM Studio**, **llama.cpp server**, and any other OpenAI-compatible HTTP API.

## Setup

1. Install the extension (`.vsix`) via `code --install-extension local-inline-suggestions-*.vsix`
2. Open VS Code settings and configure:

| Setting | Default | Description |
|---|---|---|
| `localInlineSuggestions.endpointUrl` | `http://localhost:11434` | Base URL of the LLM server — change to any IP/hostname on your network, e.g. `http://192.168.1.50:11434` |
| `localInlineSuggestions.model` | `codellama:7b` | Model name to request |
| `localInlineSuggestions.maxTokens` | `100` | Max tokens per completion |
| `localInlineSuggestions.temperature` | `0.2` | Sampling temperature |
| `localInlineSuggestions.debounceMs` | `350` | Pause before triggering a request (ms) |
| `localInlineSuggestions.maxPrefixChars` | `8000` | Max characters of prefix context sent (~2k tokens) |
| `localInlineSuggestions.enabled` | `true` | Toggle suggestions on/off |

### Remote LLM server

The endpoint does not have to be localhost. If your LLM runs on a separate machine in the same network, just set `endpointUrl` to that machine's address:

```
http://192.168.1.50:11434      # Ollama on another machine
http://gpu-box.local:1234      # LM Studio via mDNS hostname
```

### Ollama note

Requires Ollama ≥ 0.1.24 for the OpenAI-compatible `/v1/completions` endpoint.
By default Ollama only listens on `127.0.0.1`. To expose it on the network, set the environment variable:

```sh
OLLAMA_HOST=0.0.0.0 ollama serve
```

## Status bar

The `LIS` item in the status bar shows:
- `✦ LIS` — enabled, idle
- `⟳ LIS` — fetching a completion
- `⊘ LIS` — disabled
- Tooltip shows the last error message if a request failed

Click the item to toggle the extension on/off, or use the command palette: **Local Inline Suggestions: Toggle On/Off**.

## Building from source

```sh
npm install
npm run compile        # builds dist/extension.js
npm run package        # produces .vsix
```

Error output is available in **Output → Local Inline Suggestions**.
