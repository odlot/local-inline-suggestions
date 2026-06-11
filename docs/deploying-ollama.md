# Deploying a local LLM with Ollama

This guide covers how to run [Ollama](https://ollama.com) on a remote machine within your network and connect the extension to it.

## 1. Install Ollama on the remote machine

```sh
curl -fsSL https://ollama.com/install.sh | sh
```

## 2. Pull a model

Choose based on available VRAM:

| Model | VRAM | Notes |
|---|---|---|
| `qwen2.5-coder:7b` | ~6 GB | Best quality/size ratio — recommended |
| `codellama:7b` | ~6 GB | Good alternative |
| `qwen2.5-coder:1.5b` | ~2 GB | Lightweight, for limited hardware |

```sh
ollama pull qwen2.5-coder:7b
```

## 3. Expose Ollama on the network

By default Ollama only listens on `127.0.0.1`. To accept connections from other machines, set `OLLAMA_HOST`:

```sh
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

### Make it persistent with systemd

```sh
sudo systemctl edit ollama
```

Add the following to the override file that opens:

```ini
[Service]
Environment="OLLAMA_HOST=0.0.0.0:11434"
```

Then restart the service:

```sh
sudo systemctl restart ollama
```

## 4. Verify connectivity

From your local machine, confirm the remote Ollama is reachable:

```sh
curl http://<remote-ip>:11434/api/tags
```

You should get a JSON response listing the available models. If the connection times out, check that port `11434` is open in the remote machine's firewall:

```sh
# On the remote machine (ufw)
sudo ufw allow from <your-local-ip> to any port 11434

# Or for firewalld
sudo firewall-cmd --add-port=11434/tcp --permanent && sudo firewall-cmd --reload
```

## 5. Configure the extension

Open VS Code settings (`Ctrl+,`) and update:

```json
"localInlineSuggestions.endpointUrl": "http://<remote-ip>:11434",
"localInlineSuggestions.model": "qwen2.5-coder:7b"
```

The `LIS` status bar item will show a spinner the first time a completion is requested while the model loads into VRAM (cold start). Subsequent requests are fast.
