/**
 * {@link DefaultStreamingManager} — bridges the {@link StreamingManager} port to a
 * provider. If the provider streams natively it delegates; otherwise it emits the
 * full completion as a single terminal chunk (prepared behavior).
 */
import { isOk } from "@telemax/core";
import type { PreparedRequest } from "../domain/request.js";
import type { AIResponseChunk } from "../domain/response.js";
import type { AIProvider, StreamingManager } from "../interfaces.js";

export class DefaultStreamingManager implements StreamingManager {
  public async *stream(
    provider: AIProvider,
    request: PreparedRequest,
  ): AsyncIterable<AIResponseChunk> {
    if (provider.stream !== undefined) {
      yield* provider.stream(request);
      return;
    }
    const result = await provider.complete(request);
    yield {
      requestId: request.requestId,
      delta: isOk(result) ? result.value.content : "",
      done: true,
    };
  }
}
