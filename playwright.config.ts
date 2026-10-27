import { defineConfig, devices } from "@playwright/test";
import { Resource } from "sst";

// Inside `sst shell --stage <stage>` the tests run against that stage's site; BASE_URL overrides it;
// otherwise a local preview build. Never against prod (agent-playbook/continuous-delivery).
function stageSite(): { stage: string; url: string } | undefined {
  try {
    return { stage: Resource.App.stage, url: Resource.ResistorApp.url };
  } catch {
    return undefined;
  }
}

const site = stageSite();
if (site?.stage === "prod") throw new Error("E2E tests don't run against prod.");

const baseURL = process.env.BASE_URL ?? site?.url ?? "http://localhost:4173";
const useLocalPreview = !process.env.BASE_URL && !site;

console.info(`[e2e] Playwright base URL: ${baseURL}`);

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry"
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } }
  ],
  webServer: useLocalPreview
    ? {
      command: "npm run build && npm run preview -- --port 4173",
      url: "http://localhost:4173",
      reuseExistingServer: !process.env.CI
    }
    : undefined
});
