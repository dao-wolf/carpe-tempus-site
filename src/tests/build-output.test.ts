import { describe, expect, it } from "vitest"
import { site } from "../config/site"
import {
  allRoutes,
  contentRoutes,
  distFiles,
  existsInDist,
  readDist,
  redirectRoutes,
  routeToFile,
} from "./helpers/dist"

describe("Build output", () => {
  describe("Given the static build", () => {
    it("Then exactly the expected pages and redirects exist", () => {
      expect(distFiles(".html")).toEqual(
        [...allRoutes, ...redirectRoutes].map(routeToFile).sort(),
      )
    })

    it.each([
      "favicon.ico",
      "apple-touch-icon.png",
      "brand/logo-512.png",
      "og/default.png",
    ])("Then %s is published", file => {
      expect(existsInDist(file)).toBe(true)
    })
  })

  describe("Given the sitemap", () => {
    const urls = [
      ...readDist("sitemap-0.xml").matchAll(/<loc>([^<]+)<\/loc>/g),
    ].map(m => m[1])

    it("Then it lists every content page with the canonical origin, and not the 404", () => {
      expect(urls.sort()).toEqual(
        contentRoutes.map(route => `${site.url}${route}`).sort(),
      )
    })

    it("Then the sitemap index points at it", () => {
      expect(readDist("sitemap-index.xml")).toContain(
        `${site.url}/sitemap-0.xml`,
      )
    })
  })

  describe("Given robots.txt", () => {
    const robots = readDist("robots.txt")

    it("Then crawling matches the indexable flag", () => {
      if (site.indexable) {
        expect(robots).toContain("Allow: /")
        expect(robots).toContain(`Sitemap: ${site.url}/sitemap-index.xml`)
      } else {
        expect(robots).toContain("Disallow: /")
        expect(robots).not.toContain("Allow: /")
      }
    })
  })
})
