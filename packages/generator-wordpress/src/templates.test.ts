import { describe, expect, it } from "vitest";
import { allTemplates } from "./templates/index.js";

describe("allTemplates", () => {
  it("has unique ids and non-empty bodies", () => {
    const templates = allTemplates();
    const ids = new Set(templates.map((template) => template.id));
    expect(ids.size).toBe(templates.length);
    expect(templates.every((template) => template.body.trim().length > 0)).toBe(true);
  });

  it("includes the required WordPress theme files", () => {
    const names = allTemplates().map((template) => template.name);
    for (const required of [
      "style.css",
      "theme.json",
      "functions.php",
      "front-page.php",
      "single.php",
      "category.php",
      "archive.php",
      "header.php",
      "footer.php",
      "sidebar.php",
      "manifest.webmanifest",
      "template-parts/navigation.php",
      "template-parts/schema/newsarticle.php",
    ]) {
      expect(names).toContain(required);
    }
  });
});
