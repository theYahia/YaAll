# @theyahia/yandex-metrika-mcp

MCP server for Yandex.Metrica API — counters, goals, reports, logs, traffic sources, top pages. 15 tools, OAuth Bearer token auth.

[![npm](https://img.shields.io/npm/v/@theyahia/yandex-metrika-mcp)](https://www.npmjs.com/package/@theyahia/yandex-metrika-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Part of the [Russian API MCP](https://github.com/theYahia) series by [@theYahia](https://github.com/theYahia).

## Getting a Token

1. Go to [oauth.yandex.ru](https://oauth.yandex.ru/)
2. Create an app (or use an existing one)
3. Under **Platforms**, select "Web services"
4. Under **Access**, add: `Yandex.Metrica` -> `Read statistics and counter parameters`
5. Get the OAuth token:
   ```
   https://oauth.yandex.ru/authorize?response_type=token&client_id=YOUR_CLIENT_ID
   ```
6. Copy the token from the redirect URL (`access_token=...`)

## Installation

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "yandex-metrika": {
      "command": "npx",
      "args": ["-y", "@theyahia/yandex-metrika-mcp"],
      "env": {
        "YANDEX_METRIKA_TOKEN": "your_token"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add yandex-metrika -e YANDEX_METRIKA_TOKEN=your_token -- npx -y @theyahia/yandex-metrika-mcp
```

### Streamable HTTP (remote / multi-client)

```bash
YANDEX_METRIKA_TOKEN=your_token npx @theyahia/yandex-metrika-mcp --http --port=3000
```

Endpoint: `POST http://localhost:3000/mcp`
Health check: `GET http://localhost:3000/health`

### Smithery

Use `smithery.yaml` from the repository. Requires `YANDEX_METRIKA_TOKEN`.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `YANDEX_METRIKA_TOKEN` | Yes | OAuth 2.0 Bearer token from [Yandex OAuth](https://oauth.yandex.ru/) |

## Tools (15)

### Management — Counters

| Tool | Description |
|------|-------------|
| `list_counters` | List all counters. Filter by name/URL with `search_string`. |
| `get_counter` | Get full details of a single counter by ID. |
| `create_counter` | Create a new counter for a website. |
| `update_counter` | Update counter name or site URL. |
| `delete_counter` | Permanently delete a counter (irreversible). |

### Management — Goals

| Tool | Description |
|------|-------------|
| `list_goals` | List all goals for a counter. |
| `create_goal` | Create a goal (url, number, step, action types). |
| `delete_goal` | Delete a goal from a counter. |

### Management — Logs

| Tool | Description |
|------|-------------|
| `export_logs` | Export raw visit/hit logs via the Logs API. |

### Reporting API

| Tool | Description |
|------|-------------|
| `get_report` | Flexible reporting — any metrics + dimensions + filters + sort. |
| `get_report_comparison` | Compare two date periods (A vs B). |
| `get_report_drilldown` | Hierarchical drill-down into report dimensions. |

### Convenience Wrappers

| Tool | Description |
|------|-------------|
| `get_traffic_summary` | Quick overview: visits, pageviews, users, bounce rate, avg duration. |
| `get_traffic_sources` | Traffic sources breakdown by channel. |
| `get_top_pages` | Top pages by pageviews with performance metrics. |

## Demo Prompts

```
Show me all my Yandex.Metrica counters
```

```
Compare last week's traffic to the previous week for counter 12345678
```

```
What are the top 10 pages on my site this month, sorted by pageviews?
```

## Development

```bash
npm install
npm run build
npm test
npm run dev           # stdio mode
npm run start:http    # HTTP mode on port 3000
```

## API Reference

- [Yandex.Metrica Management API](https://yandex.ru/dev/metrika/doc/api2/management/intro.html)
- [Yandex.Metrica Reporting API](https://yandex.ru/dev/metrika/doc/api2/api_v1/intro.html)
- [Yandex.Metrica Logs API](https://yandex.ru/dev/metrika/doc/api2/logs/intro.html)

## License

MIT
