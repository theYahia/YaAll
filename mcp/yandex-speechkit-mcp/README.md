# @theyahia/yandex-speechkit-mcp

MCP server for Yandex SpeechKit API — speech recognition, synthesis, and voice listing. **5 tools.**

[![npm](https://img.shields.io/npm/v/@theyahia/yandex-speechkit-mcp)](https://www.npmjs.com/package/@theyahia/yandex-speechkit-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Part of the [Russian API MCP](https://github.com/theYahia/russian-mcp) series by [@theYahia](https://github.com/theYahia).

## Installation

### Claude Desktop

```json
{
  "mcpServers": {
    "yandex-speechkit": {
      "command": "npx",
      "args": ["-y", "@theyahia/yandex-speechkit-mcp"],
      "env": {
        "YANDEX_SPEECHKIT_API_KEY": "your-api-key",
        "FOLDER_ID": "your-folder-id"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add yandex-speechkit \
  -e YANDEX_SPEECHKIT_API_KEY=your-api-key \
  -e FOLDER_ID=your-folder-id \
  -- npx -y @theyahia/yandex-speechkit-mcp
```

### Streamable HTTP (remote / Docker)

```bash
YANDEX_SPEECHKIT_API_KEY=... FOLDER_ID=... npx @theyahia/yandex-speechkit-mcp --http
# Listens on :8080/mcp (override with PORT env var)
```

### Smithery

Deploy via [smithery.ai](https://smithery.ai) — config in `smithery.yaml`.

## Authentication

| Variable | Description |
|----------|-------------|
| `YANDEX_SPEECHKIT_API_KEY` | Yandex Cloud API key (preferred) |
| `YANDEX_API_KEY` | Legacy alias (still works) |
| `IAM_TOKEN` | Short-lived IAM token (alternative to API key) |
| `FOLDER_ID` | Yandex Cloud folder ID (required) |
| `YANDEX_FOLDER_ID` | Legacy alias for FOLDER_ID |

> Get credentials at [Yandex Cloud Console](https://console.cloud.yandex.ru/).

## Tools (5)

| Tool | Type | Description |
|------|------|-------------|
| `recognize` | Core | Speech recognition (STT) — Base64 audio to text |
| `synthesize` | Core | Speech synthesis (TTS) — text to Base64 audio |
| `list_voices` | Core | List available TTS voices, filter by language |
| `skill_transcribe` | Skill | High-level transcription — returns clean text |
| `skill_synthesize` | Skill | High-level synthesis — smart defaults, auto-detects language from voice |

## Examples

```
Transcribe this audio file
Synthesize "Hello, how are you?" with voice filipp
What voices are available in Russian?
Speak this text using the alena voice
```

## Development

```bash
npm install
npm run build
npm test
npm run dev    # stdio mode
```

## License

MIT
