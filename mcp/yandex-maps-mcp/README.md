# @theyahia/yandex-maps-mcp

MCP server for **Yandex Maps API** — geocoding, routing, places search, static maps for AI agents.

## Tools (10)

| Tool | Description |
|------|-------------|
| `geocode` | Address → coordinates |
| `reverse_geocode` | Coordinates → address |
| `search_places` | Search places/businesses near a point |
| `get_route` | Route between two points (driving/transit/walking) |
| `get_route_matrix` | Distance/duration matrix for multiple points |
| `get_distance` | Distance and travel time between two points |
| `suggest_address` | Address autocomplete |
| `get_static_map` | Generate static map image URL with markers |
| `get_organization` | Organization details by ID |
| `search_organizations` | Search organizations near a point |

## Setup

1. Get API key: https://developer.tech.yandex.ru/
2. Set env: `YANDEX_MAPS_API_KEY=your-key`

### Claude Desktop

```json
{
  "mcpServers": {
    "yandex-maps": {
      "command": "npx",
      "args": ["-y", "@theyahia/yandex-maps-mcp"],
      "env": { "YANDEX_MAPS_API_KEY": "your-key" }
    }
  }
}
```

## Demo Prompts

- "Find the coordinates of Красная площадь, Москва"
- "What restaurants are near 55.7558, 37.6173?"
- "Build a route from Москва to Санкт-Петербург by car"
- "Calculate a distance matrix between Moscow, SPb, and Kazan"
- "Suggest addresses starting with 'Москва, Твер'"
- "Generate a static map of central Moscow with markers at the Kremlin and Bolshoi"
- "What address is at coordinates 55.7558, 37.6173?"

## Development

```bash
npm install
npm run build
npm test
```

## License

MIT
