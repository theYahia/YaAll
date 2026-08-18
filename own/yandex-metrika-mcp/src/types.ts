export interface MetrikaCounter {
  id: number;
  name: string;
  site: string;
  status: string;
  create_time: string;
}

export interface MetrikaCountersResponse {
  counters: MetrikaCounter[];
  rows: number;
}

export interface MetrikaGoal {
  id: number;
  name: string;
  type: string;
  conditions?: Array<{
    type: string;
    url?: string;
  }>;
}

export interface MetrikaGoalsResponse {
  goals: MetrikaGoal[];
}

export interface MetrikaReportResponse {
  query: Record<string, unknown>;
  data: unknown[];
  totals: unknown[];
  total_rows: number;
}
