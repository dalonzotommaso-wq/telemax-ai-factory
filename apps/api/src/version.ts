import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

interface Pkg {
  name: string;
  version: string;
}

export function getVersionInfo(): { name: string; version: string; node: string } {
  const pkg = JSON.parse(readFileSync(join(here, "..", "package.json"), "utf-8")) as Pkg;
  return { name: pkg.name, version: pkg.version, node: process.version };
}
