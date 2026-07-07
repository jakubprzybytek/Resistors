import { test, expect } from "@playwright/test";

test("calculates a resistor network for a target value", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("tab", { name: "Custom", exact: true }).click();
  await page.getByPlaceholder(/100, 220, 330/).fill("100, 220, 330");
  await page.getByPlaceholder("660").fill("660");
  await page.getByRole("button", { name: /calculate/i }).click();

  const listItems = page.getByRole("listitem");
  await expect(listItems).toHaveCount(3);
  await expect(listItems.first()).toContainText(/Ω/);
  await expect(listItems.first()).toContainText("660.00Ω");
  await expect(page.getByText("330Ω + 330Ω")).toBeVisible();

  const calculateButton = page.getByRole("button", { name: /^> calculate$/i });
  const firstCard = listItems.first();
  const buttonBox = await calculateButton.boundingBox();
  const cardBox = await firstCard.boundingBox();

  expect(buttonBox).not.toBeNull();
  expect(cardBox).not.toBeNull();
  expect(cardBox!.y).toBeGreaterThan(buttonBox!.y);
});
