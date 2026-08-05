/**
 * Project Blueprint: the representation of the whole project to generate — its
 * logical directory structure, the artifact dependency graph, and every
 * sub-blueprint (design tokens, layout, components, SEO, accessibility, Core Web
 * Vitals, advertising, performance).
 */
import type { ResolvedWordPressConfig } from "../types.js";
import { allTemplates } from "../templates/index.js";
import { defaultDesignTokens, type DesignTokens } from "./design-tokens.js";
import { componentRegistry, componentScaffolds, type ComponentSpec } from "./components.js";
import { layoutBlueprint, type LayoutBlueprint } from "./layout-engine.js";
import { seoBlueprint, type SeoBlueprint } from "./seo.js";
import { accessibilityBlueprint, type AccessibilityBlueprint } from "./accessibility.js";
import { webVitalsBlueprint, type WebVitalsBlueprint } from "./web-vitals.js";
import { advertisementBlueprint, type AdvertisementBlueprint } from "./advertisement.js";
import { performanceBlueprint, type PerformanceBlueprint } from "./performance.js";

export interface ArtifactNode {
  readonly path: string;
  readonly kind: "template" | "component" | "emit" | "asset" | "blueprint";
  readonly dependsOn: readonly string[];
}

export interface ProjectBlueprint {
  readonly name: string;
  readonly target: "wordpress";
  readonly generatorVersion: string;
  readonly directories: readonly string[];
  readonly artifacts: readonly ArtifactNode[];
  readonly designTokens: DesignTokens;
  readonly layout: LayoutBlueprint;
  readonly components: readonly ComponentSpec[];
  readonly seo: SeoBlueprint;
  readonly accessibility: AccessibilityBlueprint;
  readonly webVitals: WebVitalsBlueprint;
  readonly advertisement: AdvertisementBlueprint;
  readonly performance: PerformanceBlueprint;
}

const DIRECTORIES: readonly string[] = [
  "config",
  "inc",
  "template-parts",
  "template-parts/ads",
  "template-parts/seo",
  "template-parts/schema",
  "template-parts/components",
  "assets/css",
  "assets/js",
  "assets/images",
  "assets/images/logos",
  "assets/images/icons",
  "assets/images/placeholders",
  "docs",
  ".telemax",
];

const DEPENDENCIES: Readonly<Record<string, readonly string[]>> = {
  "functions.php": [
    "inc/seo.php",
    "inc/schema.php",
    "inc/widgets.php",
    "inc/sitemap.php",
    "assets/css/main.css",
    "assets/js/main.js",
  ],
  "header.php": ["template-parts/seo/meta-tags.php", "template-parts/navigation.php"],
  "footer.php": ["inc/widgets.php"],
  "front-page.php": [
    "header.php",
    "footer.php",
    "sidebar.php",
    "template-parts/ads/ad-leaderboard.php",
  ],
  "single.php": [
    "header.php",
    "footer.php",
    "sidebar.php",
    "template-parts/schema/newsarticle.php",
    "template-parts/ads/ad-in-article.php",
  ],
  "category.php": ["header.php", "footer.php", "sidebar.php"],
  "archive.php": ["header.php", "footer.php"],
  "page.php": ["header.php", "footer.php"],
  "home.php": ["header.php", "footer.php", "sidebar.php"],
  "search.php": ["header.php", "footer.php"],
  "author.php": ["header.php", "footer.php", "sidebar.php"],
  "404.php": ["header.php", "footer.php"],
  "sidebar.php": ["template-parts/ads/ad-sidebar.php"],
};

const EMITTED: readonly ArtifactNode[] = [
  { path: "robots.txt", kind: "emit", dependsOn: [] },
  { path: "assets/css/tokens.css", kind: "asset", dependsOn: ["config/design-tokens.json"] },
  { path: ".telemax/build-info.json", kind: "emit", dependsOn: [] },
  { path: "docs/NAMING-CONVENTIONS.md", kind: "emit", dependsOn: [] },
  { path: "docs/BLUEPRINT.md", kind: "blueprint", dependsOn: ["config/project.blueprint.json"] },
  { path: "config/project.blueprint.json", kind: "blueprint", dependsOn: [] },
  { path: "config/design-tokens.json", kind: "blueprint", dependsOn: [] },
  { path: "config/layout.blueprint.json", kind: "blueprint", dependsOn: [] },
  { path: "config/components.json", kind: "blueprint", dependsOn: [] },
  { path: "config/seo.blueprint.json", kind: "blueprint", dependsOn: [] },
  { path: "config/accessibility.blueprint.json", kind: "blueprint", dependsOn: [] },
  { path: "config/web-vitals.blueprint.json", kind: "blueprint", dependsOn: [] },
  { path: "config/advertising.blueprint.json", kind: "blueprint", dependsOn: [] },
  { path: "config/performance.blueprint.json", kind: "blueprint", dependsOn: [] },
];

/** Build the full project blueprint. */
export function buildProjectBlueprint(config: ResolvedWordPressConfig): ProjectBlueprint {
  const tokens = defaultDesignTokens(config);
  const templateNodes: readonly ArtifactNode[] = allTemplates().map((template) => ({
    path: template.name,
    kind: "template",
    dependsOn: DEPENDENCIES[template.name] ?? [],
  }));
  const componentNodes: readonly ArtifactNode[] = componentScaffolds().map((scaffold) => ({
    path: scaffold.name,
    kind: "component",
    dependsOn: [],
  }));
  return {
    name: config.siteName,
    target: "wordpress",
    generatorVersion: "0.1.0",
    directories: DIRECTORIES,
    artifacts: [...templateNodes, ...componentNodes, ...EMITTED],
    designTokens: tokens,
    layout: layoutBlueprint(config),
    components: componentRegistry(),
    seo: seoBlueprint(config),
    accessibility: accessibilityBlueprint(tokens),
    webVitals: webVitalsBlueprint(),
    advertisement: advertisementBlueprint(),
    performance: performanceBlueprint(),
  };
}

/** Render a human-readable summary of the blueprint. */
export function blueprintDoc(blueprint: ProjectBlueprint): string {
  const contrast = blueprint.accessibility.contrastPasses ? "pass" : "review";
  return `# ${blueprint.name} — project blueprint

Generated by Telemax AI Factory · WordPress News generator v${blueprint.generatorVersion}.

- **Artifacts:** ${String(blueprint.artifacts.length)} across ${String(blueprint.directories.length)} directories
- **Components:** ${String(blueprint.components.length)} registered
- **Layout pages:** ${blueprint.layout.pages.map((page) => page.page).join(", ")}
- **Ad positions:** ${blueprint.advertisement.positions.map((position) => position.id).join(", ")}
- **Accessibility:** ${blueprint.accessibility.standard} · contrast ${contrast}
- **Core Web Vitals budgets:** LCP ${String(blueprint.webVitals.budgets.lcpMs)}ms · CLS ${String(blueprint.webVitals.budgets.cls)} · INP ${String(blueprint.webVitals.budgets.inpMs)}ms

This blueprint is the single source of truth for the generated project structure
and its artifact dependency graph. See \`config/project.blueprint.json\`.
`;
}
