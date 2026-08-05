/**
 * Performance Blueprint: cache strategy and asset policies for assets, images,
 * JavaScript, CSS and critical CSS.
 */
export interface PerformanceBlueprint {
  readonly cache: {
    readonly html: string;
    readonly assets: string;
    readonly images: string;
    readonly strategy: string;
  };
  readonly assets: {
    readonly fingerprint: boolean;
    readonly compression: readonly string[];
  };
  readonly images: {
    readonly formats: readonly string[];
    readonly lazy: boolean;
    readonly responsive: boolean;
  };
  readonly javascript: {
    readonly defer: boolean;
    readonly module: boolean;
    readonly splitVendors: boolean;
  };
  readonly css: {
    readonly minify: boolean;
    readonly critical: boolean;
    readonly criticalStrategy: string;
  };
}

/** Build the performance blueprint. */
export function performanceBlueprint(): PerformanceBlueprint {
  return {
    cache: {
      html: "s-maxage=60, stale-while-revalidate=300",
      assets: "public, max-age=31536000, immutable",
      images: "public, max-age=2592000",
      strategy: "edge CDN + full-page cache with per-path purge on publish",
    },
    assets: { fingerprint: true, compression: ["brotli", "gzip"] },
    images: { formats: ["avif", "webp", "jpeg"], lazy: true, responsive: true },
    javascript: { defer: true, module: true, splitVendors: true },
    css: {
      minify: true,
      critical: true,
      criticalStrategy: "inline above-the-fold critical CSS, defer the rest",
    },
  };
}
