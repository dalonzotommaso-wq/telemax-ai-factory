import { PROJECT_TYPES, type CreateProjectInput, type Project, type ProjectType } from "./api";

export const TYPE_LABELS: Record<ProjectType, string> = {
  "wordpress-news": "WordPress News",
  "landing-page": "Landing Page",
  react: "React",
  flutter: "Flutter",
  laravel: "Laravel",
  api: "API",
  "full-stack": "Full Stack",
};

export type SortField = "name" | "createdAt" | "updatedAt" | "status" | "type";

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
          p.name.toLowerCase().includes(needle) ||
          p.description.toLowerCase().includes(needle) ||
          p.client.toLowerCase().includes(needle),
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
  client: string;
  description: string;
  type: ProjectType | "";
  generator: string;
  knowledgePack: string;
  aiProvider: string;
}

export const WIZARD_STEPS = [
  "Details",
  "Type",
  "Generator",
  "Knowledge Pack",
  "AI Provider",
  "Confirm",
] as const;

export const INITIAL_WIZARD: WizardState = {
  step: 1,
  name: "",
  client: "",
  description: "",
  type: "",
  generator: "",
  knowledgePack: "",
  aiProvider: "",
};

export function canAdvance(state: WizardState): boolean {
  switch (state.step) {
    case 1:
      return state.name.trim().length > 0;
    case 2:
      return (PROJECT_TYPES as readonly string[]).includes(state.type);
    case 3:
      return state.generator.trim().length > 0;
    case 4:
    case 5:
      return true; // knowledge pack and AI provider are optional
    default:
      return true;
  }
}

export function wizardToInput(state: WizardState): CreateProjectInput {
  if (state.type === "") throw new Error("type is required");
  return {
    name: state.name.trim(),
    type: state.type,
    description: state.description.trim(),
    client: state.client.trim(),
    generator: state.generator,
    knowledgePack: state.knowledgePack,
    aiProvider: state.aiProvider,
  };
}
