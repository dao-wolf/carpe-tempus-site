import * as path from "node:path"
import { describe, expect, it } from "vitest"
import { primaryNav } from "../config/navigation"
import { redirects } from "../config/redirects"
import { site } from "../config/site"
import { allRoutes, existsInDist, loadPage, routeToFile } from "./helpers/dist"

const pages = allRoutes.map(route => ({ route, $: loadPage(route) }))

/** The dist/ file an internal href resolves to, mirroring the CloudFront Function. */
function targetFile(pathname: string): string | undefined {
  if (pathname.endsWith("/")) return path.join(pathname, "index.html")
  return path.extname(pathname) ? pathname : undefined
}

describe("Navigation and links", () => {
  describe.each(pages)("Given the page $route", ({ route, $ }) => {
    it("Then the primary navigation matches the configured order", () => {
      const links = $('nav[aria-label="Primary"] a')
        .toArray()
        .map(el => ({ label: $(el).text().trim(), href: $(el).attr("href") }))
      expect(links).toEqual(
        primaryNav.map(({ label, href }) => ({ label, href })),
      )
    })

    it("Then every internal link resolves to a built file", () => {
      $('a[href^="/"]').each((_, el) => {
        const url = new URL($(el).attr("href")!, "https://example.test")
        const file = targetFile(url.pathname)
        expect(file, `${url.pathname} needs a trailing slash`).toBeDefined()
        expect(
          existsInDist(file!),
          `${url.pathname} (linked from ${route})`,
        ).toBe(true)
      })
    })

    it("Then every #fragment link points at an element that exists", () => {
      $("a[href*='#']").each((_, el) => {
        const href = $(el).attr("href")!
        if (/^https?:/.test(href)) return
        const url = new URL(href, `https://example.test${route}`)
        const target =
          url.pathname === route || href.startsWith("#")
            ? $
            : loadPage(url.pathname)
        expect(
          target(`[id="${url.hash.slice(1)}"]`).length,
          `${href} on ${route}`,
        ).toBe(1)
      })
    })
  })

  describe("Given the service pages", () => {
    it("Then the breadcrumb ends with the current page", () => {
      const $ = loadPage("/services/product-engineering/")
      const crumbs = $('nav[aria-label="Breadcrumb"] li')
        .toArray()
        .map(el => $(el).text().trim())
      expect(crumbs).toEqual(["Home", "Services", "Product Engineering"])
      expect(
        $('nav[aria-label="Breadcrumb"] [aria-current="page"]').text(),
      ).toBe("Product Engineering")
    })

    it("Then Services is marked as the current section in the primary navigation", () => {
      const $ = loadPage("/services/paid-social/")
      expect(
        $('nav[aria-label="Primary"] a[href="/services/"]').attr(
          "aria-current",
        ),
      ).toBe("true")
    })
  })

  describe.each(Object.entries(redirects))(
    "Given the retired URL %s",
    (from, to) => {
      const $ = loadPage(from)

      it("Then it sends visitors on to its replacement, which exists", () => {
        expect($('meta[http-equiv="refresh"]').attr("content")).toBe(
          `0;url=${to}`,
        )
        expect(existsInDist(routeToFile(to))).toBe(true)
      })

      it("Then search engines are pointed at the replacement", () => {
        expect($('meta[name="robots"]').attr("content")).toBe("noindex")
        expect($('link[rel="canonical"]').attr("href")).toBe(`${site.url}${to}`)
      })
    },
  )

  describe("Given the 404 page", () => {
    it("Then it is built at the path CloudFront serves for missing pages", () => {
      expect(existsInDist(routeToFile("/404"))).toBe(true)
    })
  })
})
