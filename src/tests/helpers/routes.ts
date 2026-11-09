import { redirects } from "../../config/redirects"

/** Every page the site builds, as served URLs. Shared by Vitest and Playwright. "/404" is dist/404.html. */
export const contentRoutes = [
  "/",
  "/services/",
  "/services/product-engineering/",
  "/services/paid-social/",
  "/packages/",
  "/about/",
  "/contact/",
  "/privacy/",
] as const

export const allRoutes = [...contentRoutes, "/404"] as const

/** Retired URLs, each built as a page that redirects to its replacement. */
export const redirectRoutes = Object.keys(redirects)
