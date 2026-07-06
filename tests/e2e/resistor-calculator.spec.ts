import { test, expect } from "@playwright/test";

test("calculates a resistor network for a target value", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("tab", { name: "Custom", exact: true }).click();
  await page.getByPlaceholder(/100, 220, 330/).fill("100, 220, 330");
  await page.getByPlaceholder("660").fill("660");
  await page.getByRole("button", { name: /calculate/i }).click();

  const status = page.getByRole("status");
  await expect(status).toBeVisible();
  await expect(status).toContainText(/Ω/);
  await expect(status).toContainText("660.00Ω");
  await expect(status).toContainText("330Ω + 330Ω");
});
