import { defineConfig } from "@playwright/test"

// Browser tests run against the production build served by `astro preview`.
// Run `pnpm build` first. Playwright is pinned to 1.56.1 to match the Chromium
// pre-installed in Claude Code cloud sessions (PLAYWRIGHT_BROWSERS_PATH); CI and
// local machines install it with `pnpm exec playwright install chromium`.
const port = 4322
const baseURL = `http://127.0.0.1:${port}`
const executablePath = process.env.PW_CHROMIUM_EXECUTABLE

export default defineConfig({
  testDir: "e2e",
  testMatch: /.*\.e2e\.ts$/,
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    browserName: "chromium",
    trace: "retain-on-failure",
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },
  projects: [
    {
      name: "mobile",
      use: {
        viewport: { width: 375, height: 812 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 2,
      },
    },
    { name: "tablet", use: { viewport: { width: 768, height: 1024 } } },
    { name: "desktop", use: { viewport: { width: 1280, height: 800 } } },
  ],
  webServer: {
    // --ignore-lock keeps the server in the foreground even where Astro would
    // otherwise start it in the background (for example inside AI agent sessions).
    command: `pnpm exec astro preview --host 127.0.0.1 --port ${port} --ignore-lock`,
    url: `${baseURL}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    // astro preview ignores SIGTERM, which would leave Playwright waiting forever.
    gracefulShutdown: { signal: "SIGINT", timeout: 5_000 },
  },
})
