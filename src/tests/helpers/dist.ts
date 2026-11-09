/** Helpers for build-verification tests, which read the static output in dist/. */
import * as cheerio from "cheerio"
import * as fs from "node:fs"
import * as path from "node:path"

export const distDir = path.join(process.cwd(), "dist")

export { allRoutes, contentRoutes, redirectRoutes } from "./routes"

function ensureBuilt(): void {
  if (!fs.existsSync(path.join(distDir, "index.html"))) {
    throw new Error("dist/ is missing: run `pnpm build` before `pnpm test`.")
  }
}

export function routeToFile(route: string): string {
  return route === "/404" ? "404.html" : path.join(route.slice(1), "index.html")
}

export function readDist(file: string): string {
  ensureBuilt()
  return fs.readFileSync(path.join(distDir, file), "utf-8")
}

export function existsInDist(file: string): boolean {
  return fs.existsSync(path.join(distDir, file))
}

export function loadPage(route: string): cheerio.CheerioAPI {
  return cheerio.load(readDist(routeToFile(route)))
}

/** All files under dist/ with the given extension, as paths relative to dist/. */
export function distFiles(extension: string): string[] {
  ensureBuilt()
  const walk = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) return walk(full)
      return entry.name.endsWith(extension)
        ? [path.relative(distDir, full)]
        : []
    })
  return walk(distDir).sort()
}

/** Visible text of a page: scripts, styles and SVG removed, whitespace collapsed. */
export function visibleText($: cheerio.CheerioAPI): string {
  const body = $("body").clone()
  body.find("script, style, svg, template").remove()
  return body.text().replace(/\s+/g, " ").trim()
}

/** Parsed JSON-LD blocks on a page. */
export function jsonLd($: cheerio.CheerioAPI): Record<string, unknown>[] {
  return $('script[type="application/ld+json"]')
    .toArray()
    .map(el => JSON.parse($(el).text()))
}
