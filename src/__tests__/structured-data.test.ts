import { describe, expect, it } from "vitest"
import { site, type SiteConfig } from "../config/site"
import {
  breadcrumbNode,
  nodeId,
  organizationNode,
  personNode,
  serialiseGraph,
  serviceNode,
} from "../lib/structured-data"

const oleg = site.founders.find(f => f.id === "oleg-desantis")!
const chiara = site.founders.find(f => f.id === "chiara-desantis")!
const info = { jobTitle: "Co-founder", knowsAbout: ["Testing"] }

describe("Structured data builders", () => {
  describe("Given the organisation node", () => {
    const org = organizationNode(site)

    it("Then it carries the legal name and Companies House number", () => {
      expect(org.legalName).toBe("Carpe Tempus Ltd")
      expect(org.identifier).toMatchObject({ value: "11992614" })
      expect(org["@id"]).toBe(`${site.url}/#organization`)
    })

    it("Then it references both founders by @id", () => {
      expect(org.founder).toEqual([
        { "@id": nodeId.person(site, "oleg-desantis") },
        { "@id": nodeId.person(site, "chiara-desantis") },
      ])
    })

    it("Then the address is omitted until the registered office is confirmed", () => {
      expect(
        organizationNode({
          ...site,
          company: { ...site.company, registeredOffice: undefined },
        }).address,
      ).toBeUndefined()
      const confirmed: SiteConfig = {
        ...site,
        company: {
          ...site.company,
          registeredOffice: ["1 Example Street", "London", "E1 1AA"],
        },
      }
      expect(organizationNode(confirmed).address).toMatchObject({
        streetAddress: "1 Example Street, London, E1 1AA",
        addressCountry: "GB",
      })
    })
  })

  describe("Given a founder with a personal website", () => {
    const person = personNode(site, oleg, info)

    it("Then the website is their url and appears in sameAs with LinkedIn", () => {
      expect(person.url).toBe("https://daowolf.com/")
      expect(person.sameAs).toEqual(["https://daowolf.com/", oleg.linkedin])
      expect(person.worksFor).toEqual({ "@id": nodeId.organization(site) })
    })
  })

  describe("Given a founder without a website yet", () => {
    it("Then LinkedIn is used, and a website slots in when added", () => {
      expect(personNode(site, chiara, info)).toMatchObject({
        url: chiara.linkedin,
        sameAs: [chiara.linkedin],
      })
      const withSite = personNode(
        site,
        { ...chiara, website: "https://example.com/" },
        info,
      )
      expect(withSite).toMatchObject({
        url: "https://example.com/",
        sameAs: ["https://example.com/", chiara.linkedin],
      })
    })
  })

  describe("Given a service", () => {
    it("Then its provider is the organisation", () => {
      const node = serviceNode(site, {
        name: "Product Engineering",
        description: "d",
        serviceType: "t",
        path: "/services/product-engineering/",
      })
      expect(node.provider).toEqual({ "@id": nodeId.organization(site) })
      expect(node.url).toBe(`${site.url}/services/product-engineering/`)
    })
  })

  describe("Given a breadcrumb trail", () => {
    it("Then it starts at Home and numbers each crumb with an absolute URL", () => {
      const node = breadcrumbNode(site, [
        { name: "Services", path: "/services/" },
        { name: "Paid Social Marketing", path: "/services/paid-social/" },
      ])
      const items = node.itemListElement as {
        position: number
        item: string
        name: string
      }[]
      expect(items.map(i => i.position)).toEqual([1, 2, 3])
      expect(items[0]).toMatchObject({ name: "Home", item: `${site.url}/` })
      expect(items[2].item).toBe(`${site.url}/services/paid-social/`)
    })
  })

  describe("Given serialisation", () => {
    it("Then '<' is escaped so the JSON can never close its script element", () => {
      const json = serialiseGraph([{ "@type": "Thing", name: "</script><b>" }])
      expect(json).not.toContain("<")
      expect(JSON.parse(json)["@graph"][0].name).toBe("</script><b>")
    })

    it("Then no node ever claims ratings or reviews", () => {
      const json = serialiseGraph([
        organizationNode(site),
        personNode(site, oleg, info),
      ])
      expect(json).not.toMatch(/aggregateRating|"review"/)
    })
  })
})
