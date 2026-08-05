import { isErr, isOk } from "@telemax/core";
import { describe, expect, it } from "vitest";
import { validateWordPressConfig, validateTemplates } from "./validator.js";

describe("validateWordPressConfig", () => {
  it("accepts a valid config", () => {
    expect(isOk(validateWordPressConfig({ siteName: "News" }))).toBe(true);
  });

  it("rejects empty siteName, bad url and bad color", () => {
    expect(isErr(validateWordPressConfig({ siteName: "  " }))).toBe(true);
    expect(isErr(validateWordPressConfig({ siteName: "N", siteUrl: "ftp://x" }))).toBe(true);
    expect(isErr(validateWordPressConfig({ siteName: "N", primaryColor: "red" }))).toBe(true);
  });
});

describe("validateTemplates", () => {
  it("accepts templates that only use known variables", () => {
    const result = validateTemplates(
      [{ id: "a", name: "a", body: "Hello {{siteName}}" }],
      ["siteName"],
    );
    expect(isOk(result)).toBe(true);
  });

  it("rejects unknown variables, empty bodies and duplicates", () => {
    expect(isErr(validateTemplates([{ id: "a", name: "a", body: "{{nope}}" }], ["siteName"]))).toBe(
      true,
    );
    expect(isErr(validateTemplates([{ id: "a", name: "a", body: "  " }], []))).toBe(true);
    expect(
      isErr(
        validateTemplates(
          [
            { id: "dup", name: "a", body: "x" },
            { id: "dup", name: "b", body: "y" },
          ],
          [],
        ),
      ),
    ).toBe(true);
  });
});
