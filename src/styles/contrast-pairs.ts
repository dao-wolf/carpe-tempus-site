/**
 * Foreground/background token pairs that appear together in the design, with the
 * minimum WCAG contrast each must meet. Checked by src/__tests__/contrast.test.ts.
 *
 * 7   = AAA body text (we hold primary text to it)
 * 4.5 = AA normal text
 * 3   = AA non-text (focus indicators, control borders)
 */
export interface ContrastPair {
  fg: string
  bg: string
  min: number
  use: string
}

const backgrounds = ["--color-bg", "--color-bg-alt"] as const

export const contrastPairs: readonly ContrastPair[] = [
  ...backgrounds.flatMap(bg => [
    { fg: "--color-text", bg, min: 7, use: "body text" },
    { fg: "--color-heading", bg, min: 7, use: "headings and wordmark" },
    { fg: "--color-text-muted", bg, min: 4.5, use: "secondary text" },
    { fg: "--color-eyebrow", bg, min: 4.5, use: "eyebrow labels" },
    { fg: "--color-accent", bg, min: 4.5, use: "accent text" },
    { fg: "--color-link-underline", bg, min: 3, use: "link underlines" },
    { fg: "--color-focus", bg, min: 3, use: "focus ring" },
    { fg: "--color-border", bg, min: 3, use: "control borders" },
    { fg: "--color-button-bg", bg, min: 3, use: "button edge against page" },
  ]),
  {
    fg: "--color-button-text",
    bg: "--color-button-bg",
    min: 7,
    use: "button label",
  },
  {
    fg: "--color-button-text",
    bg: "--color-button-bg-hover",
    min: 7,
    use: "button label on hover",
  },
]

/** Tokens that fail text contrast and may only be used for decoration. */
export const decorativeOnlyTokens = [
  "--color-rule",
  "--color-ornament",
] as const
