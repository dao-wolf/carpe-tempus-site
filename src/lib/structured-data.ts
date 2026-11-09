/**
 * Pure builders for schema.org JSON-LD. Each page emits one @graph whose nodes
 * reference each other by @id, so search engines can join the company, its
 * founders and its services into one entity.
 */
import { primaryUrl, type Founder, type SiteConfig } from "../config/site"

export type JsonLdNode = Record<string, unknown>

export interface Crumb {
  name: string
  path: string
}

export interface ServiceInfo {
  name: string
  description: string
  serviceType: string
  path: string
}

export interface PersonInfo {
  jobTitle: string
  knowsAbout: readonly string[]
}

export function absoluteUrl(site: SiteConfig, path: string): string {
  return new URL(path, `${site.url}/`).href
}

export const nodeId = {
  organization: (site: SiteConfig) => absoluteUrl(site, "/#organization"),
  website: (site: SiteConfig) => absoluteUrl(site, "/#website"),
  person: (site: SiteConfig, id: string) => absoluteUrl(site, `/about/#${id}`),
  service: (site: SiteConfig, path: string) =>
    absoluteUrl(site, `${path}#service`),
}

/** The full company node, for the home and about pages. */
export function organizationNode(site: SiteConfig): JsonLdNode {
  const { company } = site
  return {
    "@type": "Organization",
    "@id": nodeId.organization(site),
    name: site.name,
    legalName: company.legalName,
    url: absoluteUrl(site, "/"),
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl(site, "/brand/logo-512.png"),
      width: 512,
      height: 512,
    },
    description: site.description,
    email: site.email,
    foundingDate: company.incorporated,
    foundingLocation: { "@type": "Place", name: "London, United Kingdom" },
    identifier: {
      "@type": "PropertyValue",
      propertyID: "Companies House company number",
      value: company.number,
    },
    address: company.registeredOffice
      ? {
          "@type": "PostalAddress",
          streetAddress: company.registeredOffice.join(", "),
          addressCountry: "GB",
        }
      : undefined,
    knowsAbout: [
      "Product engineering",
      "Technology strategy",
      "AI strategy",
      "Software engineering",
      "Quality engineering",
      "Test automation",
      "Incident management",
      "Engineering effectiveness",
      "Paid social advertising",
      "Content marketing",
    ],
    founder: site.founders.map(f => ({ "@id": nodeId.person(site, f.id) })),
    sameAs: [site.social.linkedin, company.companiesHouseUrl],
  }
}

/** A minimal company node, so @id references resolve on pages without the full node. */
export function organizationRef(site: SiteConfig): JsonLdNode {
  return {
    "@type": "Organization",
    "@id": nodeId.organization(site),
    name: site.name,
    url: absoluteUrl(site, "/"),
  }
}

export function personNode(
  site: SiteConfig,
  founder: Founder,
  info: PersonInfo,
): JsonLdNode {
  return {
    "@type": "Person",
    "@id": nodeId.person(site, founder.id),
    name: founder.name,
    jobTitle: info.jobTitle,
    worksFor: { "@id": nodeId.organization(site) },
    url: primaryUrl(founder),
    knowsAbout: [...info.knowsAbout],
    sameAs: [founder.website, founder.linkedin].filter(Boolean),
  }
}

export function websiteNode(site: SiteConfig): JsonLdNode {
  return {
    "@type": "WebSite",
    "@id": nodeId.website(site),
    name: site.name,
    url: absoluteUrl(site, "/"),
    inLanguage: site.locale,
    publisher: { "@id": nodeId.organization(site) },
  }
}

export function serviceNode(
  site: SiteConfig,
  service: ServiceInfo,
): JsonLdNode {
  return {
    "@type": "Service",
    "@id": nodeId.service(site, service.path),
    name: service.name,
    serviceType: service.serviceType,
    description: service.description,
    url: absoluteUrl(site, service.path),
    provider: { "@id": nodeId.organization(site) },
  }
}

/** Breadcrumbs always start at Home; pass the remaining trail. */
export function breadcrumbNode(
  site: SiteConfig,
  trail: readonly Crumb[],
): JsonLdNode {
  const crumbs: Crumb[] = [{ name: "Home", path: "/" }, ...trail]
  return {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(site, crumb.path),
    })),
  }
}

/** Serialises nodes as one @graph, escaping "<" so the JSON can never close its <script>. */
export function serialiseGraph(nodes: readonly JsonLdNode[]): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": nodes,
  }).replace(/</g, "\\u003c")
}
