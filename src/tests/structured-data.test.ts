import { describe, expect, it } from "vitest"
import { site } from "../config/site"
import { contentRoutes, jsonLd, loadPage } from "./helpers/dist"

type Node = Record<string, unknown>

const graphOf = (route: string): Node[] => {
  const blocks = jsonLd(loadPage(route))
  expect(blocks, `${route} should have one JSON-LD block`).toHaveLength(1)
  expect(blocks[0]["@context"]).toBe("https://schema.org")
  return blocks[0]["@graph"] as Node[]
}
const ofType = (graph: Node[], type: string) =>
  graph.filter(node => node["@type"] === type)
const orgId = `${site.url}/#organization`

describe("Structured data in the built pages", () => {
  describe.each(contentRoutes.map(route => ({ route })))(
    "Given the page $route",
    ({ route }) => {
      const graph = graphOf(route)

      it("Then every @id reference resolves within the page graph", () => {
        const ids = new Set(graph.map(node => node["@id"]).filter(Boolean))
        const refs = JSON.stringify(graph).match(/\{"@id":"[^"]+"\}/g) ?? []
        for (const ref of refs)
          expect(ids.has(JSON.parse(ref)["@id"]), ref).toBe(true)
      })

      it("Then it never claims ratings or reviews", () => {
        expect(JSON.stringify(graph)).not.toMatch(/aggregateRating|"review"/)
      })

      if (route !== "/") {
        it("Then breadcrumbs are numbered from 1 with absolute URLs ending at this page", () => {
          const [crumbs] = ofType(graph, "BreadcrumbList")
          const items = crumbs.itemListElement as {
            position: number
            item: string
          }[]
          expect(items.map(i => i.position)).toEqual(items.map((_, i) => i + 1))
          expect(items.at(-1)!.item).toBe(`${site.url}${route}`)
        })
      }
    },
  )

  describe.each([{ route: "/" }, { route: "/about/" }])(
    "Given the company pages ($route)",
    ({ route }) => {
      const graph = graphOf(route)

      it("Then the Organization node carries the legal identity", () => {
        const [org] = ofType(graph, "Organization")
        expect(org).toMatchObject({
          "@id": orgId,
          legalName: "Carpe Tempus Ltd",
          url: `${site.url}/`,
          identifier: { value: "11992614" },
        })
      })

      it("Then both founders are Person nodes that work for the organisation", () => {
        const people = ofType(graph, "Person")
        expect(people.map(p => p.name)).toEqual([
          "Oleg Desantis",
          "Chiara Desantis",
        ])
        for (const person of people)
          expect(person.worksFor).toEqual({ "@id": orgId })
        expect(people[0].sameAs).toContain("https://daowolf.com/")
      })

      it("Then Oleg's job title is the one daowolf.com uses", () => {
        const [oleg] = ofType(graph, "Person")
        expect(oleg.jobTitle).toBe("Product Engineering Leader")
      })
    },
  )

  describe.each([
    { route: "/services/product-engineering/", name: "Product Engineering" },
    { route: "/services/paid-social/", name: "Paid Social Marketing" },
  ])("Given the service page $route", ({ route, name }) => {
    it("Then it describes a Service provided by the organisation", () => {
      const [service] = ofType(graphOf(route), "Service")
      expect(service).toMatchObject({
        name,
        url: `${site.url}${route}`,
        provider: { "@id": orgId },
      })
    })
  })

  describe("Given the 404 page", () => {
    it("Then it has no structured data", () => {
      expect(jsonLd(loadPage("/404"))).toHaveLength(0)
    })
  })
})
