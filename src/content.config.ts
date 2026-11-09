import { defineCollection } from "astro:content"
import { glob } from "astro/loaders"
import { z } from "astro/zod"

const founderId = z.enum(["oleg-desantis", "chiara-desantis"])
const practiceId = z.enum(["product-engineering", "paid-social"])

/** Meta descriptions: long enough to be useful, short enough not to be truncated. */
const metaDescription = z.string().min(50).max(160)

const services = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/services" }),
  schema: z.object({
    title: z.string(),
    order: z.number().int(),
    lead: founderId,
    serviceType: z.string(),
    summary: z.string(),
    lede: z.string(),
    description: metaDescription,
    highlights: z.array(z.string()).min(3).max(5),
    offerings: z
      .array(z.object({ title: z.string(), description: z.string() }))
      .min(3),
    audience: z.array(z.string()).min(2),
  }),
})

const solutions = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/solutions" }),
  schema: z.object({
    title: z.string(),
    practice: z.union([practiceId, z.literal("both")]),
    order: z.number().int(),
    featured: z.boolean().default(false),
    summary: z.string(),
    problem: z.string(),
    included: z.array(z.string()).min(2),
    outcome: z.string(),
    /** Optional: only shown once the owners have confirmed typical durations. */
    duration: z.string().optional(),
  }),
})

const people = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/people" }),
  schema: z.object({
    role: z.string(),
    jobTitle: z.string(),
    practice: practiceId,
    order: z.number().int(),
    summary: z.string(),
    knowsAbout: z.array(z.string()).min(1),
  }),
})

export const collections = { services, solutions, people }
