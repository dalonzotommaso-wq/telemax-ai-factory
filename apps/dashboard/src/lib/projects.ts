import { PROJECT_TYPES, type CreateProjectInput, type Project, type ProjectType } from "./api";

export const TYPE_LABELS: Record<ProjectType, string> = {
  "wordpress-news": "WordPress News",
  "landing-page": "Landing Page",
  react: "React",
  flutter: "Flutter",
  laravel: "Laravel",
};

export type SortField = "name" | "createdAt" | "status" | "type";

/** Client-side filter + sort (mirrors the API, used for instant UX). */
export function filterAndSortProjects(
  projects: readonly Project[],
  q: string,
  sort: SortField,
  order: "asc" | "desc",
): Project[] {
  const needle = q.trim().toLowerCase();
  const filtered = needle
    ? projects.filter(
        (p) =>
          p.name.toLowerCase().includes(needle) || p.description.toLowerCase().includes(needle),
      )
    : [...projects];
  filtered.sort((a, b) => {
    const av = String(a[sort]);
    const bv = String(b[sort]);
    return order === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
  });
  return filtered;
}

export interface WizardState {
  step: number;
  name: string;
  type: ProjectType | "";
  description: string;
}

export const INITIAL_WIZARD: WizardState = { step: 1, name: "", type: "", description: "" };

export function canAdvance(state: WizardState): boolean {
  switch (state.step) {
    case 1:
      return state.name.trim().length > 0;
    case 2:
      return (PROJECT_TYPES as readonly string[]).includes(state.type);
    case 3:
      return true;
    default:
      return true;
  }
}

export function wizardToInput(state: WizardState): CreateProjectInput {
  if (state.type === "") throw new Error("type is required");
  return { name: state.name.trim(), type: state.type, description: state.description.trim() };
}
