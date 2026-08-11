import { isErr, ok } from "@telemax/core";
import type { AIRunner } from "@telemax/generator-engine";
import { describe, expect, it } from "vitest";
import { generateWordPressNews } from "./runner.js";
import {
  buildContentPlan,
  deterministicContentPlan,
  parseContentPlan,
  validateContentPlan,
} from "./content-plan.js";
import { buildPromptEngine, renderContentPlanInstruction } from "./prompts.js";
import { getConventions, seedKnowledge } from "./knowledge.js";

const VALID = {
  siteTitle: "Abruzzo Live",
  tagline: "News that matters in Abruzzo",
  siteDescription: "Independent regional journalism for Abruzzo and Molise.",
  seo: {
    title: "Abruzzo Live — Regional News",
    description: "Breaking regional news and analysis from Abruzzo and Molise, updated daily.",
    keywords: ["news", "abruzzo", "molise"],
  },
  categories: [
    { name: "Politics", slug: "politics" },
    { name: "Sport", slug: "sport" },
    { name: "Culture", slug: "culture" },
    { name: "Economy", slug: "economy" },
  ],
};

const cfg = {
  siteName: "Test News",
  siteDescription: "d",
  categories: ["Politics", "Sport"],
} as never;
const runnerReturning = (raw: string): AIRunner => ({ run: () => Promise.resolve(ok(raw)) });

async function artifacts(ai?: AIRunner): Promise<(p: string) => string> {
  const result = await generateWordPressNews(
    { siteName: "Test News" },
    { year: 2026, ...(ai ? { ai } : {}) },
  );
  if (isErr(result)) throw result.error;
  expect(result.value.state).toBe("completed");
  return (p) => result.value.artifacts.get(p)?.content ?? "";
}

describe("Content Plan contract", () => {
  it("accepts a valid schema and sanitises fields", () => {
    const r = validateContentPlan(VALID);
    if (isErr(r)) throw r.error;
    expect(r.value.siteTitle).toBe("Abruzzo Live");
    expect(r.value.categories).toHaveLength(4);
    expect(r.value.seo.keywords).toContain("abruzzo");
  });

  it("rejects a missing required field", () => {
    const { tagline: _omit, ...noTagline } = VALID;
    expect(isErr(validateContentPlan(noTagline))).toBe(true);
  });

  it("rejects a wrong-typed field", () => {
    expect(isErr(validateContentPlan({ ...VALID, siteTitle: 42 }))).toBe(true);
  });

  it("rejects missing categories", () => {
    const { categories: _c, ...noCats } = VALID;
    expect(isErr(validateContentPlan(noCats))).toBe(true);
  });

  it("strips any HTML/PHP so the AI cannot inject code", () => {
    const r = validateContentPlan({ ...VALID, siteTitle: "<?php echo 1; ?><b>Hack</b>" });
    if (isErr(r)) throw r.error;
    expect(r.value.siteTitle).not.toContain("<");
    expect(r.value.siteTitle).not.toContain("php");
  });

  it("parses JSON even with text around it, and rejects invalid/empty", () => {
    const wrapped = parseContentPlan("Here is your plan:\n```\n" + JSON.stringify(VALID) + "\n```");
    if (isErr(wrapped)) throw wrapped.error;
    expect(isErr(validateContentPlan(wrapped.value))).toBe(false);
    expect(isErr(parseContentPlan("not json"))).toBe(true);
    expect(isErr(parseContentPlan("   "))).toBe(true);
  });
});

describe("buildContentPlan (AI vs fallback)", () => {
  it("uses the AI plan when valid", () => {
    const env = buildContentPlan(JSON.stringify(VALID), cfg);
    expect(env.source).toBe("ai");
    expect(env.validation).toBe("passed");
    expect(env.plan.siteTitle).toBe("Abruzzo Live");
  });

  it("falls back with validation failed on invalid JSON", () => {
    const env = buildContentPlan("this is not json", cfg);
    expect(env.source).toBe("fallback");
    expect(env.validation).toBe("failed");
    expect(env.plan.siteTitle).toBe("Test News");
  });

  it("falls back cleanly under the stub (no AI available)", () => {
    const env = buildContentPlan("[stub:stub-model] ...", cfg);
    expect(env.source).toBe("fallback");
    expect(env.validation).toBe("passed");
  });

  it("deterministic plan is always valid", () => {
    expect(isErr(validateContentPlan(deterministicContentPlan(cfg)))).toBe(false);
  });
});

describe("Knowledge contributes to the prompt", () => {
  it("injects the naming conventions into the Content Plan instruction", async () => {
    const prompt = await buildPromptEngine();
    const knowledge = await seedKnowledge();
    const conventions = await getConventions(knowledge);
    const instruction = await renderContentPlanInstruction(prompt, {
      siteName: "Test News",
      siteDescription: "d",
      conventions,
    });
    expect(instruction).toContain("Naming conventions");
    expect(instruction).toContain("template-parts");
  });
});

describe("Generator consumes the Content Plan", () => {
  it("takes site title, tagline, description, SEO and categories from the AI plan", async () => {
    const get = await artifacts(runnerReturning(JSON.stringify(VALID)));
    expect(get("test-news/header.php")).toContain("Abruzzo Live");
    expect(get("test-news/header.php")).toContain("News that matters in Abruzzo");
    expect(get("test-news/style.css")).toContain("Independent regional journalism");
    expect(get("test-news/template-parts/seo/meta-tags.php")).toContain("Breaking regional news");
    expect(get("test-news/template-parts/seo/meta-tags.php")).toContain(
      "Abruzzo Live — Regional News",
    );
    expect(get("test-news/config/content-plan.json")).toContain('"Politics"');
    expect(get("test-news/config/content-plan.json")).toContain("Abruzzo Live");
  });

  it("falls back to a deterministic plan under the stub", async () => {
    const get = await artifacts();
    expect(get("test-news/header.php")).toContain("Test News");
    expect(get("test-news/template-parts/seo/meta-tags.php")).toContain("Read the latest news");
    expect(get("test-news/config/content-plan.json")).toContain("Test News");
  });
});
