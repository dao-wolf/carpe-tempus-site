import { describe, expect, it } from "vitest"
import { site } from "../config/site"
import { allRoutes, loadPage, visibleText } from "./helpers/dist"

// Slogans retired in the October 2026 content review.
const retiredSlogans =
  /make the most of your time|timely action|one standard|different worlds|one truth/i

const americanSpellings =
  /\b(optimiz\w*|organiz\w*|analyz\w*|prioritiz\w*|realiz\w*|recogniz\w*|specializ\w*|customiz\w*|utiliz\w*|behavior\w*|colou?r(?<!colour)s?|favorite\w*|catalog|centers?|enroll\w*|fulfill|labor|humor|honor)\b/i

describe("Copy standards", () => {
  describe.each(
    allRoutes.map(route => ({ route, text: visibleText(loadPage(route)) })),
  )("Given the page $route", ({ text }) => {
    it("Then it uses British spelling", () => {
      expect(text.match(americanSpellings)?.[0]).toBeUndefined()
    })

    it("Then it uses typographic apostrophes and quotes", () => {
      expect(text.match(/\w'\w|'\w|\w'/)?.[0]).toBeUndefined()
      expect(text).not.toContain('"')
    })

    it("Then it contains no placeholder text", () => {
      expect(
        text.match(/\b(lorem|ipsum|todo|fixme|tbc|tbd|xxx)\b/i)?.[0],
      ).toBeUndefined()
    })

    it("Then it makes no unverifiable statistical or rating claims", () => {
      expect(text.match(/\d+\s?%|[★☆]/)?.[0]).toBeUndefined()
    })

    it("Then it avoids retired motifs: acorns and Roman-numeral dates", () => {
      expect(text.match(/\bacorns?\b/i)?.[0]).toBeUndefined()
      expect(text.match(/\bM{2,3}[CDLXVI]+\b/)?.[0]).toBeUndefined()
    })

    it("Then it avoids retired slogans", () => {
      expect(text.match(retiredSlogans)?.[0]).toBeUndefined()
    })

    it("Then 'to be confirmed' only appears while something is still pending", () => {
      if (/to be confirmed/i.test(text))
        expect(site.pending.length).toBeGreaterThan(0)
    })
  })

  describe("Given the home page", () => {
    const $ = loadPage("/")
    const hero = $("main section").first().text().replace(/\s+/g, " ")

    it("Then its first section names both services", () => {
      expect(hero).toMatch(/product engineering/i)
      expect(hero).toMatch(/paid social marketing/i)
    })

    it("Then its title names both services", () => {
      expect($("title").text()).toMatch(/product engineering.+paid social/i)
    })

    it("Then its packages include one on AI and one for each service", () => {
      const titles = $(".solution-card h3")
        .toArray()
        .map(heading => $(heading).text().trim())

      expect(titles).toEqual([
        "AI Readiness Review",
        "Engineering Health Check",
        "Paid Social Audit",
      ])
    })
  })

  describe("Given the services page", () => {
    const $ = loadPage("/services/")

    it("Then each service card shows a short list, so neither looks thin", () => {
      const lengths = $(".practice-list")
        .toArray()
        .map(list => $(list).find("li").length)

      expect(lengths).toEqual([5, 5])
    })
  })

  describe("Given the Packages page", () => {
    const $ = loadPage("/packages/")

    it.each([
      "Technology Roadmap Review",
      "AI Readiness Review",
      "Operating Model Review",
      "Incident Management Review",
    ])("Then it offers the %s", title => {
      const titles = $(".solution h2")
        .toArray()
        .map(heading => $(heading).text().trim())

      expect(titles).toContain(title)
    })

    it.each(["Engineering Health Check", "Test Automation Accelerator"])(
      "Then the %s covers code written by people or AI agents",
      title => {
        const solution = $(".solution").filter(
          (_, element) => $(element).find("h2").text().trim() === title,
        )

        expect(solution.text()).toMatch(/people (and|or) AI agents/i)
      },
    )

    it("Then packages stay grouped by service, Product Engineering first", () => {
      const services = $(".solution .eyebrow")
        .toArray()
        .map(label => $(label).text().replace(/\d+/g, "").trim())
      const groups = services.filter(
        (service, index) => service !== services[index - 1],
      )

      expect(groups).toEqual([
        "Product Engineering",
        "Paid Social Marketing",
        "Both services",
      ])
    })
  })

  describe("Given the Product Engineering page", () => {
    const text = visibleText(loadPage("/services/product-engineering/"))

    it.each([
      [
        "a technology strategy and roadmap review",
        /technology strategy and roadmap/i,
      ],
      ["30, 60 and 90-day roadmaps", /30, 60 and 90-day roadmaps/i],
      ["an AI readiness review", /AI readiness review/i],
      ["AI enablement", /AI strategy and enablement/i],
      ["an operating model review", /operating model review/i],
      ["incident management", /incident management/i],
      [
        "advice on tools we’ve trialled ourselves",
        /recommend AI and engineering tools[^.]*trialled ourselves/i,
      ],
      [
        "the same practices for code from people or AI agents",
        /whether people or AI agents write the code/i,
      ],
      [
        "a way to measure what AI tools change",
        /measure what they’ve changed/i,
      ],
    ])("Then it offers %s", (_offer, wording) => {
      expect(text).toMatch(wording)
    })
  })
})
