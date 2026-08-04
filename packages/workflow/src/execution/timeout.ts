/** Race a step operation against a timeout, producing a {@link WorkflowError}. */
import { err, type Result } from "@telemax/core";
import { StepExecutionError, WorkflowTimeoutError, type WorkflowError } from "../errors.js";

export function withTimeout<T>(
  operation: Promise<Result<T, WorkflowError>>,
  timeoutMs: number,
  label: string,
): Promise<Result<T, WorkflowError>> {
  if (timeoutMs <= 0) {
    return operation;
  }
  return new Promise<Result<T, WorkflowError>>((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(
          err(new WorkflowTimeoutError(`Step "${label}" timed out after ${String(timeoutMs)}ms.`)),
        );
      }
    }, timeoutMs);
    operation.then(
      (result) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(result);
        }
      },
      (cause: unknown) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(err(new StepExecutionError(`Step "${label}" threw: ${String(cause)}`, label)));
        }
      },
    );
  });
}
