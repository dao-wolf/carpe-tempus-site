import * as fs from "node:fs"
import * as path from "node:path"
import * as vm from "node:vm"
import { beforeAll, describe, expect, it } from "vitest"
import { site } from "../config/site"

type QueryValue = { value: string; multiValue?: { value: string }[] }
interface Request {
  uri: string
  headers: Record<string, { value: string }>
  querystring: Record<string, QueryValue>
}
interface Redirect {
  statusCode: number
  headers: { location: { value: string } }
}

const source = fs.readFileSync(
  path.join(process.cwd(), "infra/cloudfront/viewer-request.js"),
  "utf-8",
)

describe("CloudFront viewer-request function", () => {
  let context: vm.Context
  let handler: (event: { request: Request }) => Request | Redirect

  beforeAll(() => {
    // Runs the file as CloudFront would: plain script, top-level `handler`.
    context = vm.createContext({})
    vm.runInContext(source, context)
    handler = context.handler
  })

  const request = (
    uri: string,
    host = "carpetempus.co.uk",
    querystring: Record<string, QueryValue> = {},
  ) =>
    handler({
      request: { uri, headers: { host: { value: host } }, querystring },
    })

  describe("Given the canonical host", () => {
    it("Then it matches site.url", () => {
      expect(context.CANONICAL_HOST).toBe(new URL(site.url).host)
    })
  })

  describe("Given a directory URL", () => {
    it.each([
      ["/", "/index.html"],
      ["/about/", "/about/index.html"],
      [
        "/services/product-engineering/",
        "/services/product-engineering/index.html",
      ],
    ])("Then %s is served from %s", (uri, expected) => {
      expect((request(uri) as Request).uri).toBe(expected)
    })
  })

  describe("Given a URL without a trailing slash", () => {
    it("Then it redirects permanently to the slashed URL", () => {
      const response = request("/about") as Redirect
      expect(response.statusCode).toBe(301)
      expect(response.headers.location.value).toBe("/about/")
    })

    it("Then the query string is kept, including repeated parameters", () => {
      const response = request("/about", "carpetempus.co.uk", {
        utm_source: { value: "linkedin" },
        tag: { value: "b", multiValue: [{ value: "a" }, { value: "b" }] },
      }) as Redirect
      expect(response.headers.location.value).toBe(
        "/about/?utm_source=linkedin&tag=a&tag=b",
      )
    })
  })

  describe("Given an explicit index.html", () => {
    it("Then it redirects to the directory URL", () => {
      const response = request("/about/index.html") as Redirect
      expect(response.statusCode).toBe(301)
      expect(response.headers.location.value).toBe("/about/")
    })
  })

  describe("Given a file", () => {
    it.each([
      "/_astro/site.abc123.css",
      "/robots.txt",
      "/sitemap-index.xml",
      "/404.html",
      "/og/default.png",
    ])("Then %s passes through unchanged", uri => {
      expect((request(uri) as Request).uri).toBe(uri)
    })
  })

  describe("Given the www host", () => {
    it("Then it redirects to the canonical host, keeping path and query", () => {
      const response = request("/contact/", "www.carpetempus.co.uk", {
        ref: { value: "card" },
      }) as Redirect
      expect(response.statusCode).toBe(301)
      expect(response.headers.location.value).toBe(
        "https://carpetempus.co.uk/contact/?ref=card",
      )
    })

    it("Then the CloudFront default domain keeps working before launch", () => {
      expect(
        (request("/about/", "d111111abcdef8.cloudfront.net") as Request).uri,
      ).toBe("/about/index.html")
    })
  })

  // Browsers read a Location of "//evil.example/x/" or "/\evil.example/x/" as
  // another site, so an unchecked path would make this an open redirect.
  describe("Given a path crafted to look like another site", () => {
    it.each([
      ["//evil.example/x", "carpetempus.co.uk"],
      ["///evil.example/x", "carpetempus.co.uk"],
      ["/\\evil.example/x", "carpetempus.co.uk"],
      ["/\\/evil.example/x", "carpetempus.co.uk"],
      ["/\t/evil.example/x", "carpetempus.co.uk"],
      ["//evil.example/index.html", "carpetempus.co.uk"],
      ["//evil.example/x", "www.carpetempus.co.uk"],
    ])("Then %j on %s redirects within this site", (uri, host) => {
      const response = request(uri, host) as Redirect
      expect(response.statusCode).toBe(301)
      const target = new URL(
        response.headers.location.value,
        `https://${host}/`,
      )
      expect(target.host).toBe("carpetempus.co.uk")
    })
  })
})
