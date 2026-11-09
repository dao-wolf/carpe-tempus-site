/**
 * Retired URLs and their replacements. Astro builds a small page at each old
 * URL that sends visitors on, so links shared before a rename keep working.
 */
export const redirects: Readonly<Record<string, string>> = {
  // Quality Engineering became Product Engineering in October 2026.
  "/services/quality-engineering/": "/services/product-engineering/",
  // Solutions became Packages in October 2026.
  "/solutions/": "/packages/",
}
