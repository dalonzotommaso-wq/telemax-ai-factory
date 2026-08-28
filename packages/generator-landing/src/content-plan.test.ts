import { isErr } from "@telemax/core";
import { describe, expect, it } from "vitest";
import { resolveLandingPageConfig } from "./config.js";
import {
  buildContentPlan,
  deterministicContentPlan,
  escapeHtml,
  parseContentPlan,
  renderSectionsHtml,
  sanitizeHref,
  sanitizeText,
  validateContentPlan,
} from "./content-plan.js";
import { buildPromptEngine, renderContentPlanInstruction } from "./prompts.js";
import { getConventions, seedKnowledge } from "./knowledge.js";

const VALID = {
  siteName: "Acme",
  seo: {
    title: "Acme — Reliable things",
    description: "Acme builds reliable things for teams that ship.",
    keywords: ["acme", "reliable", "teams"],
  },
  hero: {
    headline: "Ship with confidence",
    subheadline: "Acme gives your team the tools to deliver, on time.",
    primaryCta: { label: "Talk to us", href: "#contact" },
  },
  sections: [
    { id: "about", title: "About", body: "We are a small team with big standards." },
    { id: "services", title: "Services", body: "Design, build, and run." },
    { id: "contact", title: "Contact", body: "Reach out any time." },
  ],
  features: [{ title: "Fast", description: "We move quickly." }],
  footer: { tagline: "© Acme" },
};

const cfg = resolveLandingPageConfig({ siteName: "Test Site", description: "d" });

describe("Content Plan contract", () => {
  it("accepts a valid schema and sanitises fields", () => {
    const r = validateContentPlan(VALID);
    if (isErr(r)) throw r.error;
    expect(r.value.siteName).toBe("Acme");
    expect(r.value.sections).toHaveLength(3);
    expect(r.value.seo.keywords).toContain("acme");
    expect(r.value.hero.primaryCta.href).toBe("#contact");
  });

  it("rejects a missing hero", () => {
    const { hero: _omit, ...noHero } = VALID;
    expect(isErr(validateContentPlan(noHero))).toBe(true);
  });

  it("rejects missing sections", () => {
    const { sections: _omit, ...noSections } = VALID;
    expect(isErr(validateContentPlan(noSections))).toBe(true);
  });

  it("strips HTML/script so the AI cannot inject markup", () => {
    const r = validateContentPlan({
      ...VALID,
      hero: { ...VALID.hero, headline: "<script>alert(1)</script>Hi" },
    });
    if (isErr(r)) throw r.error;
    expect(r.value.hero.headline).not.toContain("<");
    expect(r.value.hero.headline).not.toContain("script");
  });

  it("rejects an unsafe CTA href and falls back to #contact", () => {
    expect(sanitizeHref("javascript:alert(1)")).toBe("#contact");
    expect(sanitizeHref("#pricing")).toBe("#pricing");
    expect(sanitizeHref("https://acme.example/demo")).toBe("https://acme.example/demo");
  });

  it("escapes HTML entities", () => {
    expect(escapeHtml(`a & b <c> "d" 'e'`)).toBe("a &amp; b &lt;c&gt; &quot;d&quot; &#39;e&#39;");
  });

  it("parses JSON with text around it, and rejects invalid/empty", () => {
    const wrapped = parseContentPlan("Here you go:\n```\n" + JSON.stringify(VALID) + "\n```");
    if (isErr(wrapped)) throw wrapped.error;
    expect(isErr(validateContentPlan(wrapped.value))).toBe(false);
    expect(isErr(parseContentPlan("not json"))).toBe(true);
    expect(isErr(parseContentPlan("   "))).toBe(true);
  });

  it("sanitizeText caps length and collapses whitespace", () => {
    expect(sanitizeText("a\n\n  b", 10)).toBe("a b");
    expect(sanitizeText("x".repeat(50), 5)).toHaveLength(5);
    expect(sanitizeText(42)).toBe("");
  });
});

describe("buildContentPlan (AI vs fallback)", () => {
  it("uses the AI plan when valid", () => {
    const env = buildContentPlan(JSON.stringify(VALID), cfg);
    expect(env.source).toBe("ai");
    expect(env.validation).toBe("passed");
    expect(env.plan.hero.headline).toBe("Ship with confidence");
  });

  it("falls back with validation failed on invalid JSON", () => {
    const env = buildContentPlan("this is not json", cfg);
    expect(env.source).toBe("fallback");
    expect(env.validation).toBe("failed");
    expect(env.plan.siteName).toBe("Test Site");
  });

  it("falls back with validation failed on a schema violation", () => {
    const env = buildContentPlan(JSON.stringify({ siteName: "x" }), cfg);
    expect(env.source).toBe("fallback");
    expect(env.validation).toBe("failed");
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

describe("renderSectionsHtml", () => {
  it("emits one escaped <section> per section", () => {
    const r = validateContentPlan(VALID);
    if (isErr(r)) throw r.error;
    const html = renderSectionsHtml(r.value);
    expect(html).toContain('<section id="about"');
    expect(html).toContain("<h2");
    expect(html.match(/<section /g)).toHaveLength(3);
  });
});

describe("Knowledge contributes to the prompt", () => {
  it("injects the naming conventions into the Content Plan instruction", async () => {
    const prompt = await buildPromptEngine();
    const knowledge = await seedKnowledge();
    const conventions = await getConventions(knowledge);
    const instruction = await renderContentPlanInstruction(prompt, {
      siteName: "Test Site",
      description: "d",
      conventions,
    });
    expect(instruction).toContain("Naming conventions");
    expect(instruction).toContain("in-page anchors");
  });
});
