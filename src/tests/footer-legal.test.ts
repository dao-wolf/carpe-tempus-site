import { describe, expect, it } from "vitest"
import { primaryUrl, site } from "../config/site"
import { allRoutes, loadPage } from "./helpers/dist"

// UK company websites must show the registered name, the part of the UK where the
// company is registered, its number and its registered office address.
describe("Footer and trading disclosures", () => {
  describe.each(allRoutes.map(route => ({ route, $: loadPage(route) })))(
    "Given the page $route",
    ({ $ }) => {
      const footer = $("body > footer")
      const text = footer.text().replace(/\s+/g, " ")

      it("Then it shows the legal name, jurisdiction and company number", () => {
        expect(text).toContain("Carpe Tempus Ltd.")
        expect(text).toContain("Registered in England and Wales.")
        expect(text).toContain("Company number 11992614.")
      })

      it("Then it shows the registered office, or flags it as unconfirmed", () => {
        const office = site.company.registeredOffice
        if (office) for (const line of office) expect(text).toContain(line)
        else expect(text).toContain("Registered office: to be confirmed")
      })

      it("Then it links to both founders, the company LinkedIn page, email and privacy notice", () => {
        for (const founder of site.founders) {
          expect(
            footer
              .find(`a[href="${primaryUrl(founder)}"]`)
              .text()
              .trim(),
          ).toBe(founder.name)
        }
        expect(footer.find(`a[href="${site.social.linkedin}"]`)).toHaveLength(1)
        expect(footer.find(`a[href="mailto:${site.email}"]`)).toHaveLength(1)
        expect(footer.find('a[href="/privacy/"]')).toHaveLength(1)
      })
    },
  )
})
