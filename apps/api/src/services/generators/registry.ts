// -----------------------------------------------------------------------------
// Generator adapter registry.
//
// Maps a project (via its type / installed generator id) to the adapter that can
// generate it. Adding a third target is a one-line change here plus its adapter.
// -----------------------------------------------------------------------------
import type { Project } from "../../domain.js";
import type { GeneratorAdapter, ProjectManifest } from "./adapter.js";
import { wordpressAdapter } from "./wordpress-adapter.js";
import { landingAdapter } from "./landing-adapter.js";

/** Every installed, runnable generator adapter, in match priority order. */
export const ADAPTERS: readonly GeneratorAdapter[] = [wordpressAdapter, landingAdapter];

/**
 * Resolve the adapter for a project. Throws (message beginning with
 * "No runnable generator") when no installed generator matches — the
 * GenerationService turns that into a failed generation with the error logged.
 */
export function resolveAdapter(project: Project, manifest: ProjectManifest): GeneratorAdapter {
  const found = ADAPTERS.find((adapter) => adapter.matches(project, manifest));
  if (found === undefined) {
    const target = manifest.generator || project.generator || manifest.type || project.type;
    throw new Error(
      `No runnable generator installed for "${target}". ` +
        `Installed generators: ${ADAPTERS.map((a) => a.id).join(", ")}.`,
    );
  }
  return found;
}
