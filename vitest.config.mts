/// <reference types="vitest/config" />
import { getViteConfig } from "astro/config"

// Two kinds of test live under src/:
//   src/__tests__/  unit tests that need no build
//   src/tests/      build-verification tests that read dist/ (run `pnpm build` first)
export default getViteConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
})
