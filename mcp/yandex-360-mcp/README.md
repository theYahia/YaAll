# @theyahia/yandex-360-mcp

MCP server for **Yandex 360** API. **10 tools** for users, departments, groups, Yandex Disk, calendar, and email.

[![npm](https://img.shields.io/npm/v/@theyahia/yandex-360-mcp)](https://www.npmjs.com/package/@theyahia/yandex-360-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Part of the [Russian API MCP](https://github.com/theYahia/russian-mcp) series by [@theYahia](https://github.com/theYahia).

## Setup

1. Get an OAuth token from [Yandex OAuth](https://oauth.yandex.ru/) with scopes for directory, disk, and calendar
2. Find your organization ID in [Yandex 360 admin](https://admin.yandex.ru/)

## Usage with Claude Desktop

```json
{
  "mcpServers": {
    "yandex-360": {
      "command": "npx",
      "args": ["-y", "@theyahia/yandex-360-mcp"],
      "env": {
        "YANDEX_360_TOKEN": "your-oauth-token",
        "YANDEX_360_ORG_ID": "your-org-id"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add yandex-360 -e YANDEX_360_TOKEN=token -e YANDEX_360_ORG_ID=orgid -- npx -y @theyahia/yandex-360-mcp
```

## Tools (10)

| Tool | Description |
|------|-------------|
| `list_users` | List organization users |
| `get_user` | Get user profile by ID |
| `create_user` | Create a new user in the org |
| `list_departments` | List all departments |
| `list_groups` | List all groups |
| `list_disk_resources` | List files/folders on Yandex Disk |
| `upload_disk_file` | Upload a text file to Yandex Disk |
| `list_calendar_events` | List calendar events for a user in date range |
| `create_calendar_event` | Create a calendar event with attendees |
| `send_email` | Send an email from an org user |

## Demo Prompts

```
List all users in our Yandex 360 organization
Create a user john.doe with password "SecurePass123"
Show all departments
List files in /Documents on Yandex Disk
Upload a file "notes.txt" with content "Meeting notes..." to /Documents
What events does user1 have this week?
Create a meeting "Sprint Review" tomorrow 10:00-11:00 with team@company.ru
Send an email from admin@company.ru to partner@ext.com about the contract
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `YANDEX_360_TOKEN` | Yes | Yandex OAuth token with directory/disk/calendar scopes |
| `YANDEX_360_ORG_ID` | Yes | Organization ID |

## License

MIT
