# @theyahia/yandex-tracker-mcp

MCP server for **Yandex Tracker** API. **12 tools** for issues, queues, comments, transitions, and worklogs.

[![npm](https://img.shields.io/npm/v/@theyahia/yandex-tracker-mcp)](https://www.npmjs.com/package/@theyahia/yandex-tracker-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Part of the [Russian API MCP](https://github.com/theYahia/russian-mcp) series by [@theYahia](https://github.com/theYahia).

## Setup

1. Get an OAuth token from [Yandex OAuth](https://oauth.yandex.ru/)
2. Find your organization ID in [Yandex Tracker admin](https://tracker.yandex.ru/admin/orgs)

## Usage with Claude Desktop

```json
{
  "mcpServers": {
    "yandex-tracker": {
      "command": "npx",
      "args": ["-y", "@theyahia/yandex-tracker-mcp"],
      "env": {
        "YANDEX_TRACKER_TOKEN": "your-oauth-token",
        "YANDEX_TRACKER_ORG_ID": "your-org-id"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add yandex-tracker -e YANDEX_TRACKER_TOKEN=token -e YANDEX_TRACKER_ORG_ID=orgid -- npx -y @theyahia/yandex-tracker-mcp
```

## Tools (12)

| Tool | Description |
|------|-------------|
| `list_issues` | Search/list issues with queue, keys, and filter |
| `get_issue` | Get a single issue by key |
| `create_issue` | Create an issue with queue, summary, type, priority |
| `update_issue` | Update issue fields |
| `list_issue_comments` | List all comments on an issue |
| `add_comment` | Add a comment to an issue |
| `transition_issue` | Execute a workflow transition (open, close, resolve) |
| `list_queues` | List all queues |
| `get_queue` | Get queue details |
| `search_issues` | Search using Yandex Tracker query language |
| `log_worklog` | Log time spent on an issue |
| `list_worklogs` | List worklog entries for an issue |

## Demo Prompts

```
List all open issues in queue PROJ
Create a bug "Login page crash on Safari" in queue PROJ, priority critical
Search issues: "Queue: PROJ AND Assignee: me AND Status: !closed"
Close issue PROJ-42 with transition "close"
Add a comment to PROJ-42: "Fixed in commit abc123"
Log 2 hours on PROJ-42
Show all queues in our Yandex Tracker
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `YANDEX_TRACKER_TOKEN` | Yes | Yandex OAuth token |
| `YANDEX_TRACKER_ORG_ID` | Yes | Organization ID for X-Org-ID header |

## License

MIT
