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

export type UpdateProjectInput = Partial<CreateProjectInput>;

export function isProjectType(v: unknown): v is ProjectType {
  return typeof v === "string" && (PROJECT_TYPES as readonly string[]).includes(v);
}
export function isProjectStatus(v: unknown): v is ProjectStatus {
  return typeof v === "string" && (PROJECT_STATUSES as readonly string[]).includes(v);
}
