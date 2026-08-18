/**
 * MCP response formatters.
 *
 * Rules:
 *   - success() wraps data as JSON text content
 *   - error() returns { isError: true } so the LLM can see it and retry
 *   - NEVER throw from a tool handler — always return error()
 *   - NEVER use console.log — stdout is JSON-RPC; use console.error for logs
 */

export function success(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

export function error(message: string) {
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true as const,
  };
}

/**
 * Parse "lon lat" point string from Yandex Geocoder into { lat, lon }.
 */
export function parsePos(pos: string): { lat: number; lon: number } {
  const [lon, lat] = pos.split(" ").map(Number);
  return { lat, lon };
}
