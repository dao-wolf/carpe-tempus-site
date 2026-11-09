import * as fs from "node:fs"
import * as path from "node:path"
import { allRoutes } from "../../src/tests/helpers/routes"

/** Served URL for each built page ("/404" is served from /404.html by the preview server). */
export const pageUrls = allRoutes.map(route =>
  route === "/404" ? "/404.html" : route,
)

interface HeadersPolicy {
  SecurityHeadersConfig: {
    ContentSecurityPolicy: { ContentSecurityPolicy: string }
    FrameOptions: { FrameOption: string }
    ReferrerPolicy: { ReferrerPolicy: string }
  }
  CustomHeadersConfig: { Items: { Header: string; Value: string }[] }
}

/**
 * The response headers CloudFront adds in production, from the same JSON the
 * AWS setup uses. `upgrade-insecure-requests` is dropped because the preview
 * server is plain http.
 */
export function productionHeaders(): Record<string, string> {
  const policy: HeadersPolicy = JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), "infra/cloudfront/response-headers-policy.json"),
      "utf-8",
    ),
  )
  const security = policy.SecurityHeadersConfig
  const headers: Record<string, string> = {
    "content-security-policy":
      security.ContentSecurityPolicy.ContentSecurityPolicy.replace(
        /;\s*upgrade-insecure-requests/,
        "",
      ),
    "x-content-type-options": "nosniff",
    "x-frame-options": security.FrameOptions.FrameOption,
    "referrer-policy": security.ReferrerPolicy.ReferrerPolicy,
  }
  for (const item of policy.CustomHeadersConfig.Items)
    headers[item.Header.toLowerCase()] = item.Value
  return headers
}
