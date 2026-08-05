import { isOk } from "@telemax/core";
import { describe, expect, it } from "vitest";
import { ArtifactCollection, type GeneratorArtifact } from "../domain/artifact.js";
import { InMemoryArtifactWriter } from "./writer.js";

function artifact(path: string): GeneratorArtifact {
  return { path, content: path, contentType: "text/plain", encoding: "utf-8" };
}

describe("ArtifactCollection", () => {
  it("adds, retrieves and serializes artifacts", () => {
    const collection = new ArtifactCollection();
    collection.add(artifact("a.txt"));
    collection.add(artifact("b.txt"));
    expect(collection.size).toBe(2);
    expect(collection.has("a.txt")).toBe(true);
    expect(collection.get("b.txt")?.content).toBe("b.txt");
    const output = collection.toOutput();
    expect(output.artifacts).toHaveLength(2);
    expect(output.manifest["a.txt"]).toBe("text/plain");
  });
});

describe("InMemoryArtifactWriter", () => {
  it("records written artifacts", () => {
    const writer = new InMemoryArtifactWriter();
    expect(isOk(writer.write(artifact("x.txt")))).toBe(true);
    expect(writer.get("x.txt")?.content).toBe("x.txt");
    expect(writer.list()).toHaveLength(1);
  });
});
