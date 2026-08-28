import { isErr, ok } from "@telemax/core";
import type { AIRunner } from "@telemax/generator-engine";
import { describe, expect, it } from "vitest";
import { generateLandingPage } from "./runner.js";

const VALID_PLAN = {
  siteName: "Acme",
  seo: {
    title: "Acme — Reliable things",
    description: "Acme builds reliable things for teams that ship.",
    keywords: ["acme", "reliable"],
  },
  hero: {
    headline: "Ship with confidence",
    subheadline: "The tools to deliver on time.",
    primaryCta: { label: "Talk to us", href: "#contact" },
  },
  sections: [
    { id: "about", title: "About", body: "Small team, big standards." },
    { id: "contact", title: "Contact", body: "Reach out any time." },
  ],
  features: [{ title: "Fast", description: "We move quickly." }],
  footer: { tagline: "© Acme" },
};

const runnerReturning = (raw: string): AIRunner => ({ run: () => Promise.resolve(ok(raw)) });

async function artifacts(ai?: AIRunner): Promise<(p: string) => string> {
  const result = await generateLandingPage(
    { siteName: "Test Site" },
    { year: 2026, generatedAt: "2026-01-01T00:00:00.000Z", ...(ai ? { ai } : {}) },
  );
  if (isErr(result)) throw result.error;
  expect(result.value.state).toBe("completed");
  return (p) => result.value.artifacts.get(p)?.content ?? "";
}

describe("generateLandingPage", () => {
  it("fails validation for an empty site name", async () => {
    const r = await generateLandingPage({ siteName: "  " });
    expect(isErr(r)).toBe(true);
  });

  it("produces a flat static site from the AI Content Plan", async () => {
    const get = await artifacts(runnerReturning(JSON.stringify(VALID_PLAN)));
    const html = get("index.html");
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("Ship with confidence");
    expect(html).toContain('<section id="about"');
    expect(html).toContain('href="#contact"');
    expect(get("assets/css/style.css")).toContain("Test Site");
    expect(get("assets/css/tokens.css")).toContain("--color-primary");
    expect(get("config/content-plan.json")).toContain("Ship with confidence");
    expect(get(".telemax/build-info.json")).toContain("landing-page");
  });

  it("falls back to a deterministic plan under the stub", async () => {
    const get = await artifacts();
    const html = get("index.html");
    expect(html).toContain("Test Site");
    // deterministic sections come from the default config section titles
    expect(html.toLowerCase()).toContain('id="about"');
    expect(get("config/content-plan.json")).toContain("Test Site");
  });

  it("never emits an unescaped tag from AI-provided copy", async () => {
    const hostile = {
      ...VALID_PLAN,
      hero: { ...VALID_PLAN.hero, headline: "<img src=x onerror=alert(1)>" },
    };
    const get = await artifacts(runnerReturning(JSON.stringify(hostile)));
    const html = get("index.html");
    expect(html).not.toContain("<img src=x");
  });
});
