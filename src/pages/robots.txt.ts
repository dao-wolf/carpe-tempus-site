import type { APIRoute } from "astro"
import { site } from "../config/site"

/** Until launch (site.indexable), ask all crawlers to stay away. */
export const GET: APIRoute = ({ site: origin }) => {
  const body = site.indexable
    ? [
        "User-agent: *",
        "Allow: /",
        "",
        `Sitemap: ${new URL("sitemap-index.xml", origin).href}`,
      ]
    : ["User-agent: *", "Disallow: /"]
  return new Response(`${body.join("\n")}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
