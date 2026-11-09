import { describe, expect, it } from "vitest"
import { founderById, primaryUrl, site } from "../config/site"
import { allRoutes, jsonLd, loadPage } from "./helpers/dist"

const familyHosts = new Set(
  site.founders.flatMap(f => (f.website ? [new URL(f.website).host] : [])),
)

describe("External links", () => {
  describe.each(allRoutes.map(route => ({ route, $: loadPage(route) })))(
    "Given the page $route",
    ({ $ }) => {
      it("Then links to other sites use rel=noopener, adding noreferrer outside the brand family", () => {
        $('a[href^="http"]').each((_, el) => {
          const href = $(el).attr("href")!
          const rel = ($(el).attr("rel") ?? "").split(/\s+/)
          expect(rel, href).toContain("noopener")
          expect(rel.includes("noreferrer"), href).toBe(
            !familyHosts.has(new URL(href).host),
          )
        })
      })

      it("Then no link opens a new window", () => {
        expect($("[target]")).toHaveLength(0)
      })

      it("Then every email link uses the configured address", () => {
        $('a[href^="mailto:"]').each((_, el) => {
          expect($(el).attr("href")).toBe(`mailto:${site.email}`)
        })
      })
    },
  )
})

describe("Brand family links", () => {
  const $ = loadPage("/about/")
  const oleg = founderById("oleg-desantis")
  const chiara = founderById("chiara-desantis")

  it("Then the About page links to daowolf.com", () => {
    expect($('main a[href="https://daowolf.com/"]').length).toBeGreaterThan(0)
  })

  it("Then Chiara is linked through her primary URL (LinkedIn until her site launches)", () => {
    expect($(`main a[href="${primaryUrl(chiara)}"]`).length).toBeGreaterThan(0)
  })

  it("Then each founder profile is anchored at the id used by their JSON-LD Person @id", () => {
    const people = jsonLd($)
      .flatMap(block => block["@graph"] as Record<string, unknown>[])
      .filter(node => node["@type"] === "Person")
    expect(people.map(p => new URL(p["@id"] as string).hash)).toEqual([
      `#${oleg.id}`,
      `#${chiara.id}`,
    ])
    for (const founder of [oleg, chiara])
      expect($(`article#${founder.id}`)).toHaveLength(1)
  })
})
