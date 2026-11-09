import * as cheerio from "cheerio"
import * as fs from "node:fs"
import * as path from "node:path"
import { describe, expect, it } from "vitest"
import { distFiles, readDist } from "./helpers/dist"

// The site is served with a strict Content Security Policy (infra/cloudfront/
// response-headers-policy.json): no scripts, same-origin styles, fonts and images.
// These checks keep the build compatible with it.
const policy = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), "infra/cloudfront/response-headers-policy.json"),
    "utf-8",
  ),
)
const csp: string =
  policy.SecurityHeadersConfig.ContentSecurityPolicy.ContentSecurityPolicy

describe("Content Security Policy", () => {
  describe("Given the CloudFront response headers policy", () => {
    it.each([
      "default-src 'none'",
      "script-src 'none'",
      "style-src 'self'",
      "img-src 'self'",
      "font-src 'self'",
      "object-src 'none'",
      "base-uri 'none'",
      "form-action 'none'",
      "frame-ancestors 'none'",
    ])("Then it sets %s", directive => {
      expect(csp).toContain(directive)
    })

    it("Then it never allows unsafe-inline or unsafe-eval", () => {
      expect(csp).not.toMatch(/unsafe-inline|unsafe-eval/)
    })
  })

  describe.each(distFiles(".html"))("Given %s", file => {
    const $ = cheerio.load(readDist(file))

    it("Then it has no inline styles", () => {
      expect($("style")).toHaveLength(0)
      expect($("[style]")).toHaveLength(0)
    })

    it("Then its only scripts are JSON-LD data blocks, which CSP does not execute", () => {
      $("script").each((_, el) => {
        expect($(el).attr("type")).toBe("application/ld+json")
        expect($(el).attr("src")).toBeUndefined()
      })
    })

    it("Then it has no inline event handlers or javascript: URLs", () => {
      $("*").each((_, node) => {
        const el = node as unknown as {
          tagName: string
          attribs?: Record<string, string>
        }
        for (const [name, value] of Object.entries(el.attribs ?? {})) {
          expect(name.startsWith("on"), `${name} on <${el.tagName}>`).toBe(
            false,
          )
          expect(/^\s*javascript:/i.test(value), `${name}="${value}"`).toBe(
            false,
          )
        }
      })
    })

    it("Then it has no frames, forms or plugins", () => {
      expect($("iframe, frame, form, object, embed")).toHaveLength(0)
    })

    it("Then stylesheets, fonts, icons and images are same-origin", () => {
      $("link[href]").each((_, el) => {
        const rel = $(el).attr("rel")
        if (rel === "canonical") return
        expect(
          $(el).attr("href")!.startsWith("/"),
          `${rel}: ${$(el).attr("href")}`,
        ).toBe(true)
      })
      $("img[src]").each((_, el) => {
        expect($(el).attr("src")!.startsWith("/")).toBe(true)
      })
    })
  })

  describe("Given the built CSS", () => {
    const css = distFiles(".css").map(file => readDist(file))

    it("Then it has no data: URIs or remote imports", () => {
      expect(css.length).toBeGreaterThan(0)
      for (const sheet of css) {
        expect(sheet).not.toMatch(/url\(\s*["']?data:/)
        expect(sheet).not.toMatch(/@import\s+(url\()?["']?https?:/)
      }
    })

    it("Then every preloaded font is a file the CSS actually uses", () => {
      const $ = cheerio.load(readDist("index.html"))
      const preloads = $('link[rel="preload"][as="font"]')
        .toArray()
        .map(el => $(el).attr("href")!)
      expect(preloads).toHaveLength(2)
      for (const href of preloads)
        expect(
          css.some(sheet => sheet.includes(href)),
          href,
        ).toBe(true)
    })
  })
})
