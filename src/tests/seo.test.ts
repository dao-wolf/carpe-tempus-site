import { describe, expect, it } from "vitest"
import { site } from "../config/site"
import { contentRoutes, existsInDist, loadPage } from "./helpers/dist"

const pages = contentRoutes.map(route => ({ route, $: loadPage(route) }))

describe("SEO metadata", () => {
  describe.each(pages)("Given the page $route", ({ route, $ }) => {
    it("Then it has one title that names the company", () => {
      expect($("title")).toHaveLength(1)
      expect($("title").text()).toMatch(/Carpe Tempus/)
    })

    it("Then its meta description is 50–160 characters", () => {
      const description = $('meta[name="description"]').attr("content") ?? ""
      expect(description.length).toBeGreaterThanOrEqual(50)
      expect(description.length).toBeLessThanOrEqual(160)
    })

    it("Then the canonical URL is absolute, on the site origin, and matches og:url", () => {
      const canonical = $('link[rel="canonical"]').attr("href")
      expect(canonical).toBe(`${site.url}${route}`)
      expect($('meta[property="og:url"]').attr("content")).toBe(canonical)
    })

    it("Then the social image is absolute and published", () => {
      const image = $('meta[property="og:image"]').attr("content") ?? ""
      expect(image.startsWith(`${site.url}/`)).toBe(true)
      expect(existsInDist(new URL(image).pathname)).toBe(true)
      expect($('meta[name="twitter:card"]').attr("content")).toBe(
        "summary_large_image",
      )
    })

    it("Then the language is British English", () => {
      expect($("html").attr("lang")).toBe("en-GB")
      expect($('meta[property="og:locale"]').attr("content")).toBe("en_GB")
    })

    it("Then the robots meta tag follows the indexable flag", () => {
      expect($('meta[name="robots"]').attr("content")).toBe(
        site.indexable ? "index, follow" : "noindex, nofollow",
      )
    })
  })

  describe("Given all pages together", () => {
    it("Then titles and descriptions are unique", () => {
      const titles = pages.map(({ $ }) => $("title").text())
      const descriptions = pages.map(({ $ }) =>
        $('meta[name="description"]').attr("content"),
      )
      expect(new Set(titles).size).toBe(titles.length)
      expect(new Set(descriptions).size).toBe(descriptions.length)
    })
  })

  describe("Given the 404 page", () => {
    const $ = loadPage("/404")

    it("Then it is excluded from search and has no canonical URL", () => {
      expect($('meta[name="robots"]').attr("content")).toBe("noindex, nofollow")
      expect($('link[rel="canonical"]')).toHaveLength(0)
    })
  })
})
