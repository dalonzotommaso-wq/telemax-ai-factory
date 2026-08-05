import { isErr, isOk } from "@telemax/core";
import { describe, expect, it } from "vitest";
import { PromptEngine } from "./service.js";
import { InMemoryTemplateRepository } from "./repository/in-memory-template-repository.js";
import { PromptRegistry } from "./registry.js";
import { PromptValidator } from "./validator.js";
import { DefaultTemplateRenderer } from "./rendering/default-renderer.js";
import { DefaultSchemaValidator } from "./schema/schema-validator.js";
import { DefaultPromptFormatter } from "./rendering/formatters.js";
import { PromptEventBus } from "./events.js";
import { InMemoryMetricsSink } from "./metrics/metrics.js";
import { createPromptMetadata } from "./domain/metadata.js";
import { asCompositionId, asTemplateId } from "./types.js";
import type { PromptComposition } from "./domain/composition.js";

function build(): { engine: PromptEngine; metrics: InMemoryMetricsSink } {
  const metrics = new InMemoryMetricsSink();
  const engine = new PromptEngine({
    repository: new InMemoryTemplateRepository(),
    registry: new PromptRegistry(),
    validator: new PromptValidator(),
    renderer: new DefaultTemplateRenderer(),
    schemaValidator: new DefaultSchemaValidator(),
    formatter: new DefaultPromptFormatter(),
    events: new PromptEventBus(),
    metrics,
  });
  return { engine, metrics };
}

describe("PromptEngine", () => {
  it("registers a template and bumps the version on update", async () => {
    const { engine } = build();
    const first = await engine.registerTemplate({ id: "greet", name: "greet", body: "Hi" });
    if (isErr(first)) {
      throw first.error;
    }
    expect(first.value.version).toBe(1);
    const second = await engine.registerTemplate({ id: "greet", name: "greet", body: "Hi!" });
    if (isErr(second)) {
      throw second.error;
    }
    expect(second.value.version).toBe(2);
  });

  it("renders with variables and serves subsequent renders from cache", async () => {
    const { engine, metrics } = build();
    await engine.registerTemplate({
      id: "greet",
      name: "greet",
      body: "Hi {{name}}",
      variables: [{ name: "name", type: "string", required: true }],
    });
    const first = await engine.render({ templateId: "greet", variables: { name: "Ada" } });
    if (isErr(first)) {
      throw first.error;
    }
    expect(first.value.content).toBe("Hi Ada");
    expect(first.value.cacheHit).toBe(false);

    const second = await engine.render({ templateId: "greet", variables: { name: "Ada" } });
    if (isErr(second)) {
      throw second.error;
    }
    expect(second.value.cacheHit).toBe(true);
    expect(metrics.counter("prompt.cache.hit")).toBeGreaterThanOrEqual(1);
    expect(metrics.counter("prompt.cache.miss")).toBeGreaterThanOrEqual(1);
  });

  it("fails to render when a required variable is missing", async () => {
    const { engine } = build();
    await engine.registerTemplate({
      id: "greet",
      name: "greet",
      body: "Hi {{name}}",
      variables: [{ name: "name", type: "string", required: true }],
    });
    expect(isErr(await engine.render({ templateId: "greet", variables: {} }))).toBe(true);
  });

  it("exposes dependencies as partials", async () => {
    const { engine } = build();
    await engine.registerTemplate({ id: "footer", name: "footer", body: "Bye" });
    await engine.registerTemplate({
      id: "main",
      name: "main",
      body: "{{> footer}}",
      dependencies: ["footer"],
    });
    const rendered = await engine.render({ templateId: "main" });
    if (isErr(rendered)) {
      throw rendered.error;
    }
    expect(rendered.value.content).toBe("Bye");
  });

  it("resolves localized bodies (i18n)", async () => {
    const { engine } = build();
    await engine.registerTemplate({
      id: "loc",
      name: "loc",
      body: "Hello",
      locales: { it: "Ciao" },
    });
    const it = await engine.render({ templateId: "loc", locale: "it" });
    const en = await engine.render({ templateId: "loc", locale: "en" });
    if (isErr(it) || isErr(en)) {
      throw new Error("render failed");
    }
    expect(it.value.content).toBe("Ciao");
    expect(en.value.content).toBe("Hello");
  });

  it("renders a multi-role composition and formats it", async () => {
    const { engine } = build();
    await engine.registerTemplate({ id: "sys", name: "sys", body: "You are {{persona}}" });
    await engine.registerTemplate({ id: "usr", name: "usr", body: "Q: {{q}}" });
    const composition: PromptComposition = {
      id: asCompositionId("c"),
      name: "c",
      parts: [
        { role: "system", templateId: asTemplateId("sys") },
        { role: "user", templateId: asTemplateId("usr") },
      ],
      metadata: createPromptMetadata({}, "2026-01-01T00:00:00.000Z", "en"),
    };
    const result = await engine.renderComposition(
      composition,
      { persona: "a helper", q: "hi" },
      { format: "text" },
    );
    if (isErr(result)) {
      throw result.error;
    }
    expect(result.value.prompt.messages).toHaveLength(2);
    expect(result.value.prompt.messages[0]?.content).toBe("You are a helper");
    expect(result.value.formatted).toContain("[system]");
  });

  it("round-trips templates through export and import", async () => {
    const source = build().engine;
    await source.registerTemplate({ id: "x", name: "x", body: "Hello {{n}}" });
    const bundle = await source.exportBundle();
    if (isErr(bundle)) {
      throw bundle.error;
    }
    const target = build().engine;
    const imported = await target.importBundle(bundle.value);
    if (isErr(imported)) {
      throw imported.error;
    }
    expect(isOk(await target.getTemplate("x"))).toBe(true);
  });

  it("reports prepared capabilities as not implemented", async () => {
    const { engine } = build();
    expect(isErr(await engine.runChain({ id: "c", steps: [] }, {}))).toBe(true);
    expect(isErr(await engine.augmentWithRag("q", {}))).toBe(true);
  });
});
