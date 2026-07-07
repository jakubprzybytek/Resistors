import { expect, test } from "@playwright/test";

test("shows more results, reorders them by ranking, and logs calculation stats", async ({ page }) => {
  const messages: string[] = [];
  page.on("console", (message) => {
    messages.push(message.text());
  });

  await page.goto("/");

  await page.getByRole("tab", { name: "Custom", exact: true }).click();
  await page.locator("textarea").fill("100, 150, 290");
  await page.getByPlaceholder("660").fill("300");
  await page.getByRole("button", { name: /calculate/i }).click();

  await expect(page.getByRole("listitem")).toHaveCount(3);
  await expect(page.getByRole("button", { name: /show 3 more/i })).toBeVisible();
  await expect(page.getByRole("listitem").first()).toContainText("150Ω + 150Ω");

  await page.getByRole("button", { name: /show 3 more/i }).click();
  await expect(page.getByRole("listitem")).toHaveCount(6);

  await page.getByRole("tab", { name: /resistor count/i }).click();
  await expect(page.getByRole("listitem")).toHaveCount(3);
  await expect(page.getByRole("listitem").first()).toContainText("290Ω");

  expect(messages).toEqual(
    expect.arrayContaining([
      expect.stringMatching(/^Found results: \d+$/),
      expect.stringMatching(/^Computation time: \d+\.\d{2}ms$/),
    ])
  );
});

test("shows an empty-state message when no results are found", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("tab", { name: "Custom", exact: true }).click();
  await page.locator("textarea").fill("100");
  await page.getByPlaceholder("660").fill("1000");
  await page.getByRole("button", { name: /calculate/i }).click();

  await expect(page.getByRole("status")).toContainText(/no results could be determined/i);
  await expect(page.getByRole("button", { name: /show 3 more/i })).toHaveCount(0);
});