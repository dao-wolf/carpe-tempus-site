# CLAUDE.md

@AGENTS.md

## Claude Code notes

- In cloud sessions Chromium is pre-installed at `/opt/pw-browsers` (`PLAYWRIGHT_BROWSERS_PATH`). Never run `playwright install` there.
- To look at a page, run `pnpm build`, then `pnpm exec astro preview --host 127.0.0.1 --port 4321 --ignore-lock`. Take screenshots with `playwright-core`.
- The default branch is `main`.
