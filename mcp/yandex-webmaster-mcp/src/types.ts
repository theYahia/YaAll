/**
 * Partial shapes for the Yandex Webmaster API v4 responses we render directly.
 * Fields are intentionally optional/loose — the API omits empty values, and
 * formatters degrade gracefully (falling back to raw JSON) on unexpected shapes.
 * Endpoints whose shape we don't model go through the generic renderer.
 */

export interface WebmasterHost {
  host_id: string;
  ascii_host_url?: string;
  unicode_host_url?: string;
  verified?: boolean;
  main_mirror?: unknown;
}

export interface WebmasterHostsResponse {
  hosts: WebmasterHost[];
}

/** Per-query indicators, e.g. TOTAL_SHOWS, TOTAL_CLICKS, AVG_SHOW_POSITION. */
export type QueryIndicators = Record<string, number>;

export interface PopularQuery {
  query_id: string;
  query_text: string;
  indicators: QueryIndicators;
}

export interface PopularQueriesResponse {
  queries: PopularQuery[];
  count?: number;
}

export interface UserResponse {
  user_id: number | string;
}
