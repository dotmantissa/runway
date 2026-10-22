import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/e2e",
  timeout: process.env.E2E_BASE_URL ? 150000 : 45000,
  expect: { timeout: process.env.E2E_BASE_URL ? 20000 : 5000 },
  workers: 1,
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:5174",
    trace: "retain-on-failure",
  },
  reporter: "list",
});
