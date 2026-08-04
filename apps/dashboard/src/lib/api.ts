export const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001";

export interface HealthResponse {
  status: string;
  uptime: number;
}

export async function fetchHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const res = await fetch(`${API_URL}/health`, { signal, cache: "no-store" });
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
  return (await res.json()) as HealthResponse;
}

export interface Stats {
  projects: number;
  generators: number;
  packages: number;
  tests: number;
}

export async function fetchStats(signal?: AbortSignal): Promise<Stats> {
  const res = await fetch(`${API_URL}/stats`, { signal, cache: "no-store" });
  if (!res.ok) throw new Error(`Stats failed: ${res.status}`);
  return (await res.json()) as Stats;
}

export const PROJECT_TYPES = [
  "wordpress-news",
  "landing-page",
  "react",
  "flutter",
  "laravel",
] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export const PROJECT_STATUSES = ["draft", "active", "archived"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export interface Project {
  id: number;
  uuid: string;
  name: string;
  description: string;
  type: ProjectType;
  status: ProjectStatus;
  stack: string;
  version: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectInput {
  name: string;
  type: ProjectType;
  description?: string;
  status?: ProjectStatus;
  stack?: string;
  version?: string;
}

export interface ListProjectsQuery {
  q?: string;
  sort?: "name" | "createdAt" | "status" | "type";
  order?: "asc" | "desc";
}

export async function listProjects(query: ListProjectsQuery = {}): Promise<Project[]> {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.sort) params.set("sort", query.sort);
  if (query.order) params.set("order", query.order);
  const qs = params.toString();
  const res = await fetch(`${API_URL}/projects${qs ? `?${qs}` : ""}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`List failed: ${res.status}`);
  return (await res.json()) as Project[];
}

export async function getProject(id: number): Promise<Project> {
  const res = await fetch(`${API_URL}/projects/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Get failed: ${res.status}`);
  return (await res.json()) as Project;
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const res = await fetch(`${API_URL}/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Create failed: ${res.status}`);
  return (await res.json()) as Project;
}

export async function updateProject(
  id: number,
  patch: Partial<CreateProjectInput>,
): Promise<Project> {
  const res = await fetch(`${API_URL}/projects/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`Update failed: ${res.status}`);
  return (await res.json()) as Project;
}

export async function deleteProject(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/projects/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new Error(`Delete failed: ${res.status}`);
}
