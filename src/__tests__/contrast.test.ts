import * as fs from "node:fs"
import * as path from "node:path"
import { describe, expect, it } from "vitest"
import { contrastRatio } from "../lib/contrast"
import { contrastPairs, decorativeOnlyTokens } from "../styles/contrast-pairs"

const root = process.cwd()
const tokensCss = fs.readFileSync(
  path.join(root, "src/styles/tokens.css"),
  "utf-8",
)

/** Resolves --palette-* hex values and one level of --color-*: var(--palette-*) aliases. */
function resolveTokens(css: string): Map<string, string> {
  const tokens = new Map<string, string>()
  for (const [, name, value] of css.matchAll(/(--[\w-]+):\s*([^;]+);/g)) {
    tokens.set(name, value.trim())
  }
  const resolved = new Map<string, string>()
  for (const [name, value] of tokens) {
    const alias = /^var\((--[\w-]+)\)$/.exec(value)
    const target = alias ? tokens.get(alias[1]) : value
    if (target && /^#[0-9a-f]{6}$/i.test(target)) resolved.set(name, target)
  }
  return resolved
}

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(full)
    return /\.(css|astro)$/.test(entry.name) ? [full] : []
  })
}

describe("Colour contrast (design tokens)", () => {
  const tokens = resolveTokens(tokensCss)

  describe("Given the WCAG contrast maths", () => {
    it("Then black on white is 21:1 and a colour against itself is 1:1", () => {
      expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5)
      expect(contrastRatio("#b83a26", "#b83a26")).toBeCloseTo(1, 5)
    })
  })

  describe("Given the palette", () => {
    it("Then every palette token is a six-digit hex colour", () => {
      const palette = [...tokensCss.matchAll(/(--palette-[\w-]+):\s*([^;]+);/g)]
      expect(palette.length).toBeGreaterThan(0)
      for (const [, name, value] of palette) {
        expect(value.trim(), name).toMatch(/^#[0-9a-f]{6}$/i)
      }
    })
  })

  describe.each(contrastPairs)("Given $fg on $bg ($use)", ({ fg, bg, min }) => {
    it(`Then the contrast ratio is at least ${min}:1`, () => {
      const fgHex = tokens.get(fg)
      const bgHex = tokens.get(bg)
      expect(fgHex, `${fg} must resolve to a hex colour`).toBeDefined()
      expect(bgHex, `${bg} must resolve to a hex colour`).toBeDefined()
      expect(contrastRatio(fgHex!, bgHex!)).toBeGreaterThanOrEqual(min)
    })
  })

  describe("Given decorative-only tokens", () => {
    const files = sourceFiles(path.join(root, "src"))

    it.each(decorativeOnlyTokens)(
      "Then %s is never used for text, outlines or fills",
      token => {
        const misuse = new RegExp(
          `(^|[\\s;{])(color|outline-color|outline|fill)\\s*:[^;]*var\\(${token}\\)`,
          "m",
        )
        for (const file of files) {
          const css = fs.readFileSync(file, "utf-8")
          expect(
            misuse.test(css),
            `${path.relative(root, file)} uses ${token} for text`,
          ).toBe(false)
        }
      },
    )
  })
})
