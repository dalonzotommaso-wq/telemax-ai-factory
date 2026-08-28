/**
 * Workflow Engine integration. A prepare workflow computes the build metadata
 * that is written to `.telemax/build-info.json`.
 */
import type { WorkflowDefinition } from "@telemax/workflow";
import type { ResolvedLandingPageConfig } from "./types.js";
import { GENERATOR_VERSION } from "./variables.js";

/** Workflow id of the Landing Page prepare workflow. */
export const LP_PREPARE_WORKFLOW = "lp-prepare";

/** Build the prepare workflow for a given resolved config. */
export function buildPrepareWorkflow(config: ResolvedLandingPageConfig): WorkflowDefinition {
  return {
    id: LP_PREPARE_WORKFLOW,
    name: "Landing Page prepare",
    root: {
      id: "build-meta",
      kind: "task",
      handler: "echo",
      input: {
        generator: "landing-page",
        generatorVersion: GENERATOR_VERSION,
        site: config.siteName,
        target: "landing-page",
      },
      output: "build",
    },
  };
}
