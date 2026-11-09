# Agent guide

Instructions for AI coding agents (and humans) working on the Carpe Tempus website. Read the [README](README.md) first.

## Ground rules

1. **Static and script-free.** The site ships no client-side JavaScript and must work under a strict Content Security Policy: `script-src 'none'` and `style-src 'self'`.
   - Never add `<script>` (JSON-LD data blocks are the one exception).
   - Never add inline `style=""` attributes, `define:vars` or `<Font />`.
   - Never add third-party embeds.
   - `src/tests/csp-compliance.test.ts` enforces all of this.
2. **Design tokens only.**
   - Colours exist only in `src/styles/tokens.css`. Everywhere else, use the semantic `--color-*` tokens; Stylelint blocks hex, `rgb()` and similar.
   - Fonts come from `--font-display` and `--font-body`.
   - When you add a colour pairing, declare it in `src/styles/contrast-pairs.ts` so the contrast test covers it.
3. **Single source of truth.**
   - Company facts, URLs and launch state live in `src/config/site.ts`.
   - Copy lives in `src/content/`.
   - The logo is the supplied artwork, `src/assets/brand/carpe-tempus-logo.jpg`. If you replace it or change the palette, run `pnpm brand:render` and commit the regenerated `src/assets/brand/oak.png` and files in `public/`.
   - The oak-leaf geometry lives in `src/lib/brand.ts`.
4. **Honest copy.** Say plainly what we sell. British English and typographic apostrophes (’). Never invent clients, testimonials, ratings, statistics or credentials. The owners keep the brand and copy guides privately; anything that needs their confirmation goes to them, not into the site.
5. **Links.**
   - Internal links end with `/`.
   - If you rename or remove a page, add its old URL to `src/config/redirects.ts`.
   - Links to other sites use `ExternalLink`, which sets `rel` and trims whitespace. Never use `target="_blank"`.
6. **Accessibility.** WCAG 2.2 AA:
   - one `h1` per page, headings never skip a level
   - decorative SVGs have `aria-hidden="true"`
   - visible focus
   - touch targets of at least 24 × 24 px

## Workflow

- Write or update a test first where behaviour changes. Tests are Given/When/Then Vitest suites:
  - `src/__tests__/` holds unit tests.
  - `src/tests/` holds build-verification tests, which read `dist/`, so build first.
- Before committing, run `pnpm verify`, then `pnpm test:e2e` for anything visual. The pre-commit hook runs check, build, test and lint-staged.
- Commit small, logical changes. `main` is the production branch; merges deploy automatically.
- **This repository is public.** Commit messages, pull requests and CI logs are visible to anyone. Keep internal reasoning, owner decisions and research out of them.

## Gotchas

- **Whitespace:** Astro 7 defaults to JSX-style whitespace (`compressHTML: "jsx"`), which drops spaces between inline elements. This project sets `compressHTML: true`; keep it.
- **Stylesheets:** `build.inlineStylesheets: "never"` is required by the CSP. Don't change it.
- **Preview server in agent sessions:** `astro preview` starts in the background inside AI agent sessions. Pass `--ignore-lock` to keep it in the foreground, and stop it with SIGINT; Playwright's config already does both.
- **Pinned versions:**
  - Playwright is pinned to 1.56.1 to match the Chromium pre-installed in Claude Code cloud sessions. Upgrade `@playwright/test` and `playwright-core` together, deliberately.
  - TypeScript stays on 6.x until `@astrojs/check` supports 7.
- **New package versions:** pnpm refuses any version published less than a day ago (`minimumReleaseAge` in `pnpm-workspace.yaml`), so an install can fail with `ERR_PNPM_NO_MATURE_MATCHING_VERSION` or `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`. Wait a day, or for an urgent fix add that one version to `minimumReleaseAgeExclude`. Dependabot waits 7 days (14 for majors) for the same reason; security updates don't wait.
- **Brand renderer:** `scripts/render-brand-assets.mjs` cuts the oak out of the logo by taking the first band of rows with ink in it. A replacement logo needs the same layout: the tree on top, the text below a clear gap, on a plain light background.
- **Sharp:** `sharp` is a direct dependency because pnpm hides Astro's own copy, and `<Image>` needs it to build. Keep it.
