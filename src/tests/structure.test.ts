import { describe, expect, it } from "vitest"
import { primaryNav } from "../config/navigation"
import { allRoutes, loadPage } from "./helpers/dist"

describe("Accessible page structure", () => {
  describe.each(allRoutes.map(route => ({ route, $: loadPage(route) })))(
    "Given the page $route",
    ({ route, $ }) => {
      it("Then it has exactly one h1", () => {
        expect($("h1")).toHaveLength(1)
      })

      it("Then heading levels never skip on the way down", () => {
        const levels = $("h1, h2, h3, h4, h5, h6")
          .toArray()
          .map(el => Number(el.tagName.slice(1)))
        levels.reduce((previous, level) => {
          expect(
            level,
            `h${previous} is followed by h${level}`,
          ).toBeLessThanOrEqual(previous + 1)
          return level
        })
      })

      it("Then the skip link is the first focusable element and targets main", () => {
        const first = $("body")
          .find("a[href], button, input, select, textarea, [tabindex]")
          .first()
        expect(first.hasClass("skip-link")).toBe(true)
        expect(first.attr("href")).toBe("#main")
        expect($("main#main")).toHaveLength(1)
      })

      it("Then the header, primary navigation and footer landmarks are present", () => {
        expect($("body > header")).toHaveLength(1)
        expect($('nav[aria-label="Primary"]')).toHaveLength(1)
        expect($("body > footer")).toHaveLength(1)
      })

      it("Then at most one element is marked as the current page", () => {
        const current = $('[aria-current="page"]')
        expect(current.length).toBeLessThanOrEqual(1)
        if (route === "/" || primaryNav.some(item => item.href === route))
          expect(current).toHaveLength(1)
      })

      it("Then ids are unique", () => {
        const ids = $("[id]")
          .toArray()
          .map(el => $(el).attr("id"))
        expect(new Set(ids).size).toBe(ids.length)
      })

      it("Then every link has an accessible name and no positive tabindex is used", () => {
        $("a").each((_, el) => {
          const name = $(el).text().trim() || $(el).attr("aria-label")
          expect(name, $.html(el)).toBeTruthy()
        })
        $("[tabindex]").each((_, el) => {
          expect(Number($(el).attr("tabindex"))).toBeLessThanOrEqual(0)
        })
      })

      it("Then inline links neither start nor end with whitespace, which would be underlined", () => {
        // Flex containers (buttons, arrow links, navigation, the lockup) drop edge whitespace.
        const flex = /\b(link-arrow|button|nav-link|lockup)\b/
        $("a").each((_, el) => {
          if (flex.test($(el).attr("class") ?? "")) return
          expect($(el).html(), $.html(el).slice(0, 80)).not.toMatch(/^\s|\s$/)
        })
      })

      it("Then decorative SVGs are hidden from assistive technology", () => {
        $("svg").each((_, el) => {
          // Nested SVGs inherit aria-hidden from their parent.
          const hidden = $(el).closest('[aria-hidden="true"]').length > 0
          expect(hidden, $.html(el).slice(0, 80)).toBe(true)
        })
      })

      it("Then images have alt text", () => {
        $("img").each((_, el) => {
          expect($(el).attr("alt")).toBeDefined()
        })
      })
    },
  )
})
