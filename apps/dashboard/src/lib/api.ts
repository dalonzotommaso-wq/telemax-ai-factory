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
  "api",
  "full-stack",
] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export const PROJECT_STATUSES = ["draft", "active", "archived"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export interface Project {
  id: number;
  uuid: string;
  slug: string;
  name: string;
  description: string;
  client: string;
  category: string;
  type: ProjectType;
  stack: string;
  generator: string;
  workflow: string;
  knowledgePack: string;
  aiProvider: string;
  version: string;
  status: ProjectStatus;
  workspace: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectInput {
  name: string;
  type: ProjectType;
  description?: string;
  client?: string;
  category?: string;
  stack?: string;
  generator?: string;
  workflow?: string;
  knowledgePack?: string;
  aiProvider?: string;
  version?: string;
  status?: ProjectStatus;
}

export interface ListProjectsQuery {
  q?: string;
  sort?: "name" | "createdAt" | "updatedAt" | "status" | "type";
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

export async function archiveProject(id: number): Promise<Project> {
  const res = await fetch(`${API_URL}/projects/${id}/archive`, { method: "POST" });
  if (!res.ok) throw new Error(`Archive failed: ${res.status}`);
  return (await res.json()) as Project;
}

export async function duplicateProject(id: number): Promise<Project> {
  const res = await fetch(`${API_URL}/projects/${id}/duplicate`, { method: "POST" });
  if (!res.ok) throw new Error(`Duplicate failed: ${res.status}`);
  return (await res.json()) as Project;
}

// ---------------------------------------------------------------------------
// System / RepositoryService client — real platform status (no fake data).
// ---------------------------------------------------------------------------
export interface SystemPackage {
  name: string;
  version: string;
  private: boolean;
  path: string;
  description: string;
  kind: "package" | "app";
  internalDependencies: string[];
  externalDependencies: string[];
  publicApi: string;
  built: boolean;
  state: "built" | "source";
}

export interface SystemApp {
  name: string;
  version: string;
  path: string;
  description: string;
  stack: string[];
  built: boolean;
}

export interface SystemGit {
  available: boolean;
  branch: string | null;
  lastCommit: string | null;
  lastCommitShort: string | null;
  lastCommitSubject: string | null;
  lastCommitDate: string | null;
  lastCommitAuthor: string | null;
  lastTag: string | null;
  tagsOnHead: string[];
  dirty: boolean;
  totalCommits: number | null;
  pendingChangesets: number;
}

export interface SystemStatus {
  repository: {
    name: string;
    version: string;
    description: string;
    root: string;
    turboTasks: string[];
  };
  counts: {
    packages: number;
    apps: number;
    generators: number;
    tests: number;
    endpoints: number;
  };
  packages: SystemPackage[];
  apps: SystemApp[];
  generators: { name: string; version: string; path: string }[];
  knowledgePacks: { name: string }[];
  workflow: { package: string; version: string } | null;
  aiProviders: { name: string; implemented: boolean }[];
  build: {
    status: "built" | "not-built" | "partial";
    workspacesBuilt: number;
    workspacesTotal: number;
    artifactsPresent: boolean;
    note: string;
  };
  git: SystemGit;
  scannedAt: string;
}

export async function fetchSystemStatus(signal?: AbortSignal): Promise<SystemStatus> {
  const res = await fetch(`${API_URL}/system/status`, { signal, cache: "no-store" });
  if (!res.ok) throw new Error(`System status failed: ${res.status}`);
  return (await res.json()) as SystemStatus;
}

export async function fetchSystemPackages(signal?: AbortSignal): Promise<SystemPackage[]> {
  const res = await fetch(`${API_URL}/system/packages`, { signal, cache: "no-store" });
  if (!res.ok) throw new Error(`System packages failed: ${res.status}`);
  return (await res.json()) as SystemPackage[];
}

export async function fetchSystemApps(signal?: AbortSignal): Promise<SystemApp[]> {
  const res = await fetch(`${API_URL}/system/apps`, { signal, cache: "no-store" });
  if (!res.ok) throw new Error(`System apps failed: ${res.status}`);
  return (await res.json()) as SystemApp[];
}

export async function fetchSystemGit(signal?: AbortSignal): Promise<SystemGit> {
  const res = await fetch(`${API_URL}/system/git`, { signal, cache: "no-store" });
  if (!res.ok) throw new Error(`System git failed: ${res.status}`);
  return (await res.json()) as SystemGit;
}

// ---------------------------------------------------------------------------
// Generation client — real project generation (no mocks).
// ---------------------------------------------------------------------------
export type GenerationStatus = "running" | "completed" | "failed";

export interface GenerationFile {
  id: number;
  generationId: number;
  name: string;
  path: string;
  bytes: number;
  sha256: string;
  createdAt: string;
}

export interface GenerationLog {
  id: number;
  generationId: number;
  ts: string;
  level: "info" | "error";
  phase: string;
  message: string;
}

export interface Generation {
  id: number;
  projectId: number;
  generator: string;
  status: GenerationStatus;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  fileCount: number;
  outputDir: string;
  error: string | null;
  files?: GenerationFile[];
  history?: { id: number; status: GenerationStatus; startedAt: string; fileCount: number }[];
}

export async function generateProject(id: number): Promise<Generation> {
  const res = await fetch(`${API_URL}/projects/${id}/generate`, { method: "POST" });
  if (!res.ok && res.status !== 200 && res.status !== 201) {
    throw new Error(`Generate failed: ${res.status}`);
  }
  return (await res.json()) as Generation;
}

export async function fetchGeneration(id: number, signal?: AbortSignal): Promise<Generation | null> {
  const res = await fetch(`${API_URL}/projects/${id}/generation`, { signal, cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Generation failed: ${res.status}`);
  return (await res.json()) as Generation;
}

export async function fetchGenerationLogs(id: number, signal?: AbortSignal): Promise<GenerationLog[]> {
  const res = await fetch(`${API_URL}/projects/${id}/logs`, { signal, cache: "no-store" });
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`Logs failed: ${res.status}`);
  return (await res.json()) as GenerationLog[];
}

/** Direct URL to download the generated theme ZIP for a project. */
export function themeDownloadUrl(id: number): string {
  return `${API_URL}/projects/${id}/download/theme`;
}
