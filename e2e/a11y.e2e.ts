import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"
import { pageUrls } from "./support/site"

const wcag22aa = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]

test.describe("Accessibility (axe, WCAG 2.2 AA)", () => {
  for (const url of pageUrls) {
    test(`${url} has no violations`, async ({ page }) => {
      await page.goto(url)
      await page.evaluate(() => document.fonts.ready)
      const results = await new AxeBuilder({ page })
        .withTags(wcag22aa)
        .analyze()
      const violations = results.violations.map(
        v =>
          `${v.id} (${v.impact}): ${v.help} — ${v.nodes.map(n => n.target.join(" ")).join(", ")}`,
      )
      expect(violations).toEqual([])
    })
  }
})
