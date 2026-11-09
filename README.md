# Carpe Tempus website

Source code for the website of **Carpe Tempus Ltd**, a London consultancy for product engineering and paid social marketing.

- **Stack:** [Astro 7](https://astro.build) static site with zero client-side JavaScript. TypeScript, pnpm and Node 24.
- **Hosting:** AWS S3 and CloudFront, deployed from GitHub Actions with OpenID Connect. No AWS keys are stored in GitHub.
- **Quality gates:** type-checking, Stylelint (design tokens only), Prettier, Vitest (unit and build-verification tests), and Playwright with axe (WCAG 2.2 AA) at mobile, tablet and desktop widths.

The site builds with `noindex` and a disallow-all `robots.txt` until launch (`site.indexable` in `src/config/site.ts`).

## Quick start

```bash
nvm use                 # Node 24 (see .nvmrc); Node 22.22+ also works
corepack enable         # or install pnpm 11 yourself
pnpm install
pnpm dev                # http://localhost:4321
```

| Command             | What it does                                                   |
| ------------------- | -------------------------------------------------------------- |
| `pnpm dev`          | Development server with hot reload                             |
| `pnpm build`        | Production build into `dist/`                                  |
| `pnpm preview`      | Serve `dist/` locally                                          |
| `pnpm check`        | TypeScript and Astro diagnostics                               |
| `pnpm lint`         | Stylelint (colour tokens only) and Prettier                    |
| `pnpm test`         | Unit and build-verification tests (run `pnpm build` first)     |
| `pnpm test:e2e`     | Playwright + axe accessibility and smoke tests (after a build) |
| `pnpm verify`       | check, lint, build and test in one go                          |
| `pnpm brand:render` | Cut the oak from the logo; regenerate icons and social card    |

The first time you run browser tests on your own machine, install Chromium with `pnpm exec playwright install chromium`. Claude Code cloud sessions already have it.

A pre-commit hook (Husky) runs `check`, `build` and `test`, then formats and lints the staged files.

## Where things live

```
src/config/site.ts        Company facts, URLs, founders' links, launch flags: the single source of truth
src/config/redirects.ts   Retired URLs and where they now point
src/content/              Copy in Markdown: services/, solutions/, people/
src/pages/                One file per page (services/[slug].astro renders both service pages)
src/components/           Header, footer, lockup, cards, oak illustration, oak leaf…
src/assets/brand/         The supplied logo and the oak cut out of it by `pnpm brand:render`
src/lib/brand.ts          Oak-leaf geometry
src/styles/tokens.css     Colours, type and spacing: the only file allowed colour values
src/tests/, src/__tests__ Build-verification and unit tests
e2e/                      Playwright + axe tests
infra/cloudfront/         CloudFront Function and security headers
```

## Editing content

- **Services, solutions and founder bios** are Markdown files in `src/content/`. Each file's front matter is validated against `src/content.config.ts`, so a typo fails the build with a clear message.
- **Company details, email, domain and links** live in `src/config/site.ts`.
- **Copy conventions:** British English, typographic apostrophes (’), no invented clients, testimonials or statistics. A test enforces these.
- **Renaming a page:** add the old URL to `src/config/redirects.ts`, so links already shared keep working.

## Licence

All rights reserved. See [LICENSE](LICENSE).
