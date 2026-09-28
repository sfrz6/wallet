import { defineConfig, devices } from "@playwright/test";

// E2E configuration. Requires a running app with a real DATABASE_URL and
// DEV_EMAIL_FALLBACK=true so verification codes are surfaced for the test.
// Run: npm run build && npm run start, then npm run test:e2e
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: process.env.APP_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
