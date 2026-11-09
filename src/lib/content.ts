/** Collection helpers shared by pages: sorted entries and founders merged with site config. */
import { getCollection, type CollectionEntry } from "astro:content"
import { primaryUrl, site, type Founder } from "../config/site"

export type Service = CollectionEntry<"services">
export type Solution = CollectionEntry<"solutions">
type Person = CollectionEntry<"people">

export interface FounderProfile extends Founder {
  entry: Person
  role: string
  jobTitle: string
  summary: string
  knowsAbout: readonly string[]
  practice: Person["data"]["practice"]
  primaryUrl: string
}

const byOrder = (
  a: { data: { order: number } },
  b: { data: { order: number } },
) => a.data.order - b.data.order

export async function getServices(): Promise<Service[]> {
  return (await getCollection("services")).sort(byOrder)
}

export async function getSolutions(): Promise<Solution[]> {
  return (await getCollection("solutions")).sort(byOrder)
}

export async function getFounders(): Promise<FounderProfile[]> {
  const entries = (await getCollection("people")).sort(byOrder)
  return entries.map(entry => {
    const founder = site.founders.find(f => f.id === entry.id)
    if (!founder) {
      throw new Error(
        `src/content/people/${entry.id}.md has no matching founder in src/config/site.ts`,
      )
    }
    return { ...founder, ...entry.data, entry, primaryUrl: primaryUrl(founder) }
  })
}

/** Display label for a solution's practice, e.g. "Product Engineering" or "Both services". */
export function practiceLabel(
  practice: Solution["data"]["practice"],
  services: Service[],
): string {
  if (practice === "both") return "Both services"
  return services.find(s => s.id === practice)?.data.title ?? practice
}
