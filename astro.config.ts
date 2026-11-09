import sitemap from "@astrojs/sitemap"
import { defineConfig } from "astro/config"
import { redirects } from "./src/config/redirects"
import { site } from "./src/config/site"

// Launch guard: refuse to build an indexable site while facts are unconfirmed.
if (site.indexable && site.pending.length > 0) {
  throw new Error(
    `site.indexable is true but these items are still pending confirmation: ${site.pending.join(", ")}. ` +
      "Confirm them in src/config/site.ts before launch.",
  )
}

export default defineConfig({
  site: site.url,
  output: "static",
  // Every page is a directory with an index.html; the CloudFront Function relies on this.
  trailingSlash: "always",
  build: {
    format: "directory",
    // The CSP header allows only same-origin stylesheets, so never inline <style>.
    inlineStylesheets: "never",
    assets: "_astro",
  },
  // Astro 7's default ('jsx') can drop spaces between inline elements in prose.
  compressHTML: true,
  // Retired URLs build a page that sends visitors on (see src/config/redirects.ts).
  redirects: { ...redirects },
  devToolbar: { enabled: false },
  integrations: [sitemap()],
  vite: {
    // No data: URIs, so font-src/img-src 'self' holds.
    build: { assetsInlineLimit: 0 },
  },
})
