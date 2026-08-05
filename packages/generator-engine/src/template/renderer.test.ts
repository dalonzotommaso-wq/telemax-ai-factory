import { isErr } from "@telemax/core";
import { describe, expect, it } from "vitest";
import { DefaultTemplateRenderer } from "./renderer.js";

describe("DefaultTemplateRenderer", () => {
  it("interpolates variables into the template body", () => {
    const result = new DefaultTemplateRenderer().render(
      { id: "t", name: "t", body: "Hello {{name}}!" },
      { name: "Ada" },
    );
    if (isErr(result)) {
      throw result.error;
    }
    expect(result.value).toBe("Hello Ada!");
  });
});
