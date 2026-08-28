import { isErr } from "@telemax/core";
import { describe, expect, it } from "vitest";
import type { GeneratorTemplate } from "@telemax/generator-engine";
import { validateLandingPageConfig, validateTemplates } from "./validator.js";
import { allTemplates } from "./templates/index.js";
import { KNOWN_VARIABLES } from "./variables.js";

describe("validateLandingPageConfig", () => {
  it("accepts a minimal valid config", () => {
    expect(isErr(validateLandingPageConfig({ siteName: "Acme" }))).toBe(false);
  });

  it("rejects an empty site name", () => {
    const r = validateLandingPageConfig({ siteName: "   " });
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error.issues[0]).toContain("siteName");
  });

  it("rejects a non-absolute site URL", () => {
    expect(isErr(validateLandingPageConfig({ siteName: "Acme", siteUrl: "acme.example" }))).toBe(
      true,
    );
  });

  it("rejects a non-hex colour", () => {
    expect(isErr(validateLandingPageConfig({ siteName: "Acme", primaryColor: "blue" }))).toBe(true);
  });

  it("rejects an empty section title", () => {
    expect(isErr(validateLandingPageConfig({ siteName: "Acme", sections: ["Ok", " "] }))).toBe(
      true,
    );
  });
});

describe("validateTemplates", () => {
  it("passes for the shipped templates against KNOWN_VARIABLES", () => {
    expect(isErr(validateTemplates(allTemplates(), KNOWN_VARIABLES))).toBe(false);
  });

  it("flags an unknown variable", () => {
    const bad: GeneratorTemplate = { id: "x", name: "x.html", body: "{{nope}}" };
    const r = validateTemplates([bad], KNOWN_VARIABLES);
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error.issues[0]).toContain("nope");
  });

  it("flags an empty body and a duplicate id", () => {
    const a: GeneratorTemplate = { id: "dup", name: "a", body: " " };
    const b: GeneratorTemplate = { id: "dup", name: "b", body: "ok" };
    const r = validateTemplates([a, b], KNOWN_VARIABLES);
    expect(isErr(r)).toBe(true);
    if (isErr(r)) {
      expect(r.error.issues.some((i) => i.includes("empty body"))).toBe(true);
      expect(r.error.issues.some((i) => i.includes("Duplicate template id"))).toBe(true);
    }
  });
});
