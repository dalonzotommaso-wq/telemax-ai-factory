/**
 * Core Web Vitals Blueprint: LCP/CLS/INP budgets and the techniques the project
 * is prepared to use (lazy loading, preload, prefetch, responsive images).
 */
export interface WebVitalsBlueprint {
  readonly budgets: {
    readonly lcpMs: number;
    readonly cls: number;
    readonly inpMs: number;
  };
  readonly techniques: {
    readonly lazyLoading: readonly string[];
    readonly preload: readonly string[];
    readonly prefetch: readonly string[];
    readonly responsiveImages: readonly string[];
  };
}

/** Build the Core Web Vitals blueprint. */
export function webVitalsBlueprint(): WebVitalsBlueprint {
  return {
    budgets: { lcpMs: 2500, cls: 0.1, inpMs: 200 },
    techniques: {
      lazyLoading: [
        'Below-the-fold images use loading="lazy" and decoding="async".',
        "Iframes and embeds are lazy-mounted on interaction or viewport entry.",
      ],
      preload: [
        "Preload the LCP hero image and the primary web font.",
        "Preconnect to the ad and analytics origins.",
      ],
      prefetch: [
        "Prefetch the most likely next article on hover/focus.",
        "Use quicklink-style prefetch for in-viewport internal links.",
      ],
      responsiveImages: [
        "Serve srcset/sizes with modern formats (AVIF/WebP) and explicit width/height.",
        "Reserve media aspect-ratio boxes to protect CLS.",
      ],
    },
  };
}
