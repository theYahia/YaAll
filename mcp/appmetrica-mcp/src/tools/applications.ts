import { apiGet } from "../client.js";

export async function handleListApplications(): Promise<string> {
  const data = await apiGet("/management/v1/applications");
  return JSON.stringify(data, null, 2);
}
