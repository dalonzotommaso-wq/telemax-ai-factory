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

export type UpdateProjectInput = Partial<CreateProjectInput>;

export function isProjectType(v: unknown): v is ProjectType {
  return typeof v === "string" && (PROJECT_TYPES as readonly string[]).includes(v);
}
export function isProjectStatus(v: unknown): v is ProjectStatus {
  return typeof v === "string" && (PROJECT_STATUSES as readonly string[]).includes(v);
}

/** URL/filesystem-safe slug derived from a project name. */
export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "project"
  );
}
