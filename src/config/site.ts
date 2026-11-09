/**
 * Single source of truth for company facts, external URLs and launch state.
 * Components read from here; nothing else should hard-code these values.
 */

export type FounderId = "oleg-desantis" | "chiara-desantis"

export interface Founder {
  /** Matches the entry id in src/content/people/. */
  id: FounderId
  name: string
  /** Personal website. When set, it replaces LinkedIn as the founder's primary link everywhere. */
  website?: string
  linkedin: string
}

/** Things the owners must confirm before the site can be made indexable (see astro.config.ts). */
export type PendingItem =
  "domain" | "email" | "registered-office" | "copy-review" | "privacy-review"

export interface SiteConfig {
  name: string
  /** The English meaning of the name, shown with the wordmark. */
  motto: string
  /** Canonical origin, without a trailing slash. */
  url: string
  /** false = every page is noindex and robots.txt disallows crawling. Switch on at launch. */
  indexable: boolean
  locale: string
  /** Default meta description, used by the home page. */
  description: string
  email: string
  company: {
    legalName: string
    number: string
    jurisdiction: string
    /** ISO date of incorporation. */
    incorporated: string
    /** Address lines as registered at Companies House; undefined until confirmed. */
    registeredOffice?: readonly string[]
    companiesHouseUrl: string
  }
  social: {
    linkedin: string
  }
  founders: readonly Founder[]
  pending: readonly PendingItem[]
}

export const site: SiteConfig = {
  name: "Carpe Tempus",
  motto: "Seize the time",
  url: "https://carpetempus.co.uk",
  indexable: false,
  locale: "en-GB",
  description:
    "Carpe Tempus is a London consultancy for product engineering and paid social marketing. We help you ship better software and grow through paid social.",
  // Placeholder until the owners confirm the mailbox (listed in `pending`).
  email: "hello@carpetempus.co.uk",
  company: {
    legalName: "Carpe Tempus Ltd",
    number: "11992614",
    jurisdiction: "England and Wales",
    incorporated: "2019-05-13",
    registeredOffice: undefined,
    companiesHouseUrl:
      "https://find-and-update.company-information.service.gov.uk/company/11992614",
  },
  social: {
    linkedin: "https://www.linkedin.com/company/14812934",
  },
  founders: [
    {
      id: "oleg-desantis",
      name: "Oleg Desantis",
      website: "https://daowolf.com/",
      linkedin: "https://www.linkedin.com/in/daowolf/",
    },
    {
      id: "chiara-desantis",
      name: "Chiara Desantis",
      linkedin: "https://www.linkedin.com/in/chiaradesantis/",
    },
  ],
  pending: ["domain", "email", "registered-office", "privacy-review"],
}

/** The URL used wherever a founder is linked: their own site if they have one, otherwise LinkedIn. */
export function primaryUrl(founder: Founder): string {
  return founder.website ?? founder.linkedin
}

export function founderById(id: FounderId): Founder {
  const founder = site.founders.find(f => f.id === id)
  if (!founder) throw new Error(`Unknown founder id: ${id}`)
  return founder
}
