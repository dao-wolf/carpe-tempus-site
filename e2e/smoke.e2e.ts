import { expect, test } from "@playwright/test"
import { pageUrls, productionHeaders } from "./support/site"

test.describe("Smoke", () => {
  for (const url of pageUrls) {
    test(`${url} renders cleanly under the production security headers`, async ({
      page,
    }, testInfo) => {
      const problems: string[] = []
      page.on("console", message => {
        // CSP violations are reported as console errors ("Refused to ...").
        if (message.type() === "error") problems.push(message.text())
      })
      page.on("pageerror", error =>
        problems.push(`page error: ${error.message}`),
      )
      page.on("requestfailed", request =>
        problems.push(`request failed: ${request.url()}`),
      )

      const headers = productionHeaders()
      await page.route("**/*", async route => {
        const response = await route.fetch()
        const isDocument = route.request().resourceType() === "document"
        await route.fulfill({
          response,
          headers: isDocument
            ? { ...response.headers(), ...headers }
            : undefined,
        })
      })

      const response = await page.goto(url)
      expect(response?.status()).toBe(200)
      await page.evaluate(() => document.fonts.ready)

      expect(problems).toEqual([])
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      )
      expect(overflow, "page scrolls horizontally").toBeLessThanOrEqual(0)
      await expect(page.locator("h1")).toBeVisible()
      for (const link of await page
        .locator('nav[aria-label="Primary"] a')
        .all()) {
        await expect(link).toBeVisible()
      }

      await testInfo.attach(
        `${testInfo.project.name}${url.replace(/\//g, "_")}.png`,
        {
          body: await page.screenshot({ fullPage: true }),
          contentType: "image/png",
        },
      )
    })
  }

  test("the skip link is the first tab stop and moves focus to the main content", async ({
    page,
  }) => {
    await page.goto("/about/")
    await page.keyboard.press("Tab")
    const skipLink = page.locator(".skip-link")
    await expect(skipLink).toBeFocused()
    await expect(skipLink).toBeInViewport()
    await page.keyboard.press("Enter")
    await expect(page.locator("main#main")).toBeFocused()
  })

  test("both web fonts load", async ({ page }) => {
    await page.goto("/")
    await page.evaluate(() => document.fonts.ready)
    const loaded = await page.evaluate(() => [
      document.fonts.check('500 48px "Newsreader Variable"'),
      document.fonts.check('400 16px "Inter Variable"'),
    ])
    expect(loaded).toEqual([true, true])
  })

  test("no cookies or browser storage are used", async ({ page, context }) => {
    for (const url of pageUrls) await page.goto(url)
    expect(await context.cookies()).toEqual([])
    expect(
      await page.evaluate(() => localStorage.length + sessionStorage.length),
    ).toBe(0)
  })

  test("nothing animates when reduced motion is requested", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.goto("/")
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0)
  })
})
