import * as fs from "node:fs"
import * as path from "node:path"
import { describe, expect, it } from "vitest"
import { primaryNav } from "../config/navigation"
import { founderById, primaryUrl, site, type Founder } from "../config/site"
import { linkLabel } from "../lib/links"

const peopleDir = path.join(process.cwd(), "src/content/people")

describe("Site configuration", () => {
  describe("Given the canonical site URL", () => {
    it("Then it is an https origin without a path or trailing slash", () => {
      const url = new URL(site.url)
      expect(url.protocol).toBe("https:")
      expect(url.pathname).toBe("/")
      expect(site.url.endsWith("/")).toBe(false)
    })
  })

  describe("Given the launch guard", () => {
    it("Then the site is only indexable once nothing is pending confirmation", () => {
      expect(site.indexable && site.pending.length > 0).toBe(false)
    })

    it("Then the registered office stays pending until an address is set", () => {
      expect(site.pending.includes("registered-office")).toBe(
        !site.company.registeredOffice,
      )
    })
  })

  describe("Given the founders", () => {
    it("Then every founder has a LinkedIn profile and any website is https", () => {
      for (const founder of site.founders) {
        expect(new URL(founder.linkedin).hostname).toMatch(/linkedin\.com$/)
        if (founder.website)
          expect(new URL(founder.website).protocol).toBe("https:")
      }
    })

    it("Then Oleg's primary link is daowolf.com, on its canonical bare host", () => {
      expect(primaryUrl(founderById("oleg-desantis"))).toBe(
        "https://daowolf.com/",
      )
    })

    it("Then a founder without a website falls back to LinkedIn", () => {
      const founder: Founder = {
        id: "chiara-desantis",
        name: "Test",
        linkedin: "https://www.linkedin.com/in/test/",
      }
      expect(primaryUrl(founder)).toBe(founder.linkedin)
      expect(primaryUrl({ ...founder, website: "https://example.com/" })).toBe(
        "https://example.com/",
      )
    })

    it("Then every people entry has a founder in the config, and vice versa", () => {
      const entries = fs
        .readdirSync(peopleDir)
        .filter(file => file.endsWith(".md"))
        .map(file => file.replace(/\.md$/, ""))
        .sort()
      expect(entries).toEqual(site.founders.map(f => f.id).sort())
    })
  })

  describe("Given the primary navigation", () => {
    it("Then every link is an internal path with a trailing slash", () => {
      for (const item of primaryNav) expect(item.href).toMatch(/^\/[a-z-]+\/$/)
    })
  })

  describe("Given external link labels", () => {
    it("Then websites show their host and LinkedIn shows its name", () => {
      expect(linkLabel("https://www.daowolf.com/")).toBe("daowolf.com")
      expect(linkLabel("https://uk.linkedin.com/in/someone")).toBe("LinkedIn")
      expect(linkLabel("https://www.linkedin.com/company/14812934")).toBe(
        "LinkedIn",
      )
    })
  })
})
