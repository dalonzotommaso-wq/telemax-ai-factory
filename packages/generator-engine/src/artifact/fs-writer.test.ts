import { mkdtempSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { isErr, isOk } from "@telemax/core";
import { describe, expect, it } from "vitest";
import { FileSystemArtifactWriter } from "./fs-writer.js";
import type { GeneratorArtifact } from "../domain/artifact.js";

function artifact(path: string, content: string): GeneratorArtifact {
  return { path, content, contentType: "text/plain", encoding: "utf-8" };
}

describe("FileSystemArtifactWriter", () => {
  it("writes files, creating nested directories", () => {
    const root = mkdtempSync(join(tmpdir(), "fsw-"));
    const writer = new FileSystemArtifactWriter(root);
    expect(isOk(writer.write(artifact("a/b/c.txt", "hello")))).toBe(true);
    expect(existsSync(join(root, "a/b/c.txt"))).toBe(true);
    expect(readFileSync(join(root, "a/b/c.txt"), "utf-8")).toBe("hello");
    expect(writer.writtenPaths()).toContain("a/b/c.txt");
  });

  it("decodes base64 artifacts", () => {
    const root = mkdtempSync(join(tmpdir(), "fsw-"));
    const writer = new FileSystemArtifactWriter(root);
    writer.write({
      path: "bin.dat",
      content: Buffer.from("binary").toString("base64"),
      contentType: "application/octet-stream",
      encoding: "base64",
    });
    expect(readFileSync(join(root, "bin.dat"), "utf-8")).toBe("binary");
  });

  it("refuses to write outside the root", () => {
    const root = mkdtempSync(join(tmpdir(), "fsw-"));
    const writer = new FileSystemArtifactWriter(root);
    expect(isErr(writer.write(artifact("../escape.txt", "x")))).toBe(true);
  });
});
