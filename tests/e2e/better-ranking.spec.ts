import { expect, test } from "@playwright/test";

test("reveals adjacent spine tiers and skips dominated counts", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("tab", { name: "Custom", exact: true }).click();
  await page.locator("textarea").fill("100, 150, 220, 330");
  await page.getByPlaceholder("660").fill("560");
  await page.getByRole("button", { name: /calculate/i }).click();

  const headings = page.getByRole("heading", { level: 2 });
  await expect(headings).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "4 resistors" })).toBeVisible();

  await page.getByRole("button", { name: /show simpler/i }).click();
  await expect(page.getByRole("heading", { name: "2 resistors" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "3 resistors" })).toHaveCount(0);

  await page.getByRole("button", { name: /show more accurate/i }).click();
  await expect(page.getByRole("heading", { name: "5 resistors" })).toBeVisible();
});

test("browses tier carousel and disables arrows at bounds", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("tab", { name: "Custom", exact: true }).click();
  await page.locator("textarea").fill("100, 150, 220, 330");
  await page.getByPlaceholder("660").fill("560");
  await page.getByRole("button", { name: /calculate/i }).click();

  const prevButton = page.getByRole("button", { name: /previous configuration/i }).first();
  const nextButton = page.getByRole("button", { name: /next configuration/i }).first();
  const descriptions = page.getByTestId("network-description");

  await expect(prevButton).toBeDisabled();
  await expect(nextButton).toBeEnabled();

  const firstDescription = await descriptions.first().innerText();
  await nextButton.click();
  await expect(page.getByText("2 / 4")).toBeVisible();
  const secondDescription = await descriptions.first().innerText();
  expect(secondDescription).not.toBe(firstDescription);

  await page.getByRole("button", { name: /next configuration/i }).first().click();
  await page.getByRole("button", { name: /next configuration/i }).first().click();
  await expect(page.getByText("4 / 4")).toBeVisible();
  await expect(page.getByRole("button", { name: /next configuration/i }).first()).toBeDisabled();

  await page.getByRole("button", { name: /previous configuration/i }).first().click();
  await expect(page.getByText("3 / 4")).toBeVisible();
  await expect(page.getByText("1 / 4")).toHaveCount(0);
});

test("shows empty state with no navigation when no results are found", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("tab", { name: "Custom", exact: true }).click();
  await page.locator("textarea").fill("100");
  await page.getByPlaceholder("660").fill("1000");
  await page.getByRole("button", { name: /calculate/i }).click();

  await expect(page.getByRole("status")).toContainText(/no results could be determined/i);
  await expect(page.getByRole("button", { name: /show more accurate/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /show simpler/i })).toHaveCount(0);
});
