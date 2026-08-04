/**
 * Demo CLI for the Telemax WordPress News generator.
 *
 *   telemax generate wordpress-news [--out <dir>] [--name <site>] [--url <url>]
 *
 * Generates a complete WordPress News project into the output directory
 * (default: output/wordpress-news).
 */
import { isErr } from "@telemax/core";
import { generateWordPressNewsProject, DEFAULT_OUTPUT_DIR } from "../project.js";
import type { WordPressSiteConfig } from "../types.js";

const USAGE = `telemax — Telemax AI Factory CLI

Usage:
  telemax generate wordpress-news [--out <dir>] [--name <site>] [--url <url>]

Options:
  --out <dir>    Output directory (default: ${DEFAULT_OUTPUT_DIR})
  --name <site>  Site name (default: "Telemax News")
  --url <url>    Site URL (default: https://news.example.com)
`;

function parseFlags(args: readonly string[]): Readonly<Record<string, string>> {
  const flags: Record<string, string> = {};
  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (token?.startsWith("--") === true) {
      const value = args[index + 1];
      if (value !== undefined && !value.startsWith("--")) {
        flags[token.slice(2)] = value;
        index += 1;
      }
    }
  }
  return flags;
}

async function main(): Promise<number> {
  const argv = process.argv.slice(2);
  const [command, target, ...rest] = argv;

  if (command !== "generate" || target !== "wordpress-news") {
    process.stdout.write(USAGE);
    return command === undefined ? 0 : 1;
  }

  const flags = parseFlags(rest);
  const config: WordPressSiteConfig = {
    siteName: flags["name"] ?? "Telemax News",
    siteUrl: flags["url"] ?? "https://news.example.com",
  };
  const outputDir = flags["out"] ?? DEFAULT_OUTPUT_DIR;

  process.stdout.write(`Generating WordPress News project into ${outputDir} …\n`);
  const result = await generateWordPressNewsProject(config, { outputDir });
  if (isErr(result)) {
    process.stderr.write(`Generation failed: ${result.error.message}\n`);
    return 1;
  }

  const project = result.value;
  process.stdout.write(
    `Done. Wrote ${String(project.fileCount)} files to ${project.outputDir}\n` +
      `Manifest: ${project.manifestPath}\n`,
  );
  return 0;
}

void main().then((code) => {
  process.exitCode = code;
});
