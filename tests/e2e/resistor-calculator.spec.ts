import { test, expect } from "@playwright/test";

test("calculates a resistor network and renders the balanced anchor below Calculate", async ({ page }) => {
  const messages: string[] = [];
  page.on("console", (message) => {
    messages.push(message.text());
  });

  await page.goto("/");

  await page.getByRole("tab", { name: "Custom", exact: true }).click();
  await page.getByPlaceholder(/100, 220, 330/).fill("100, 220, 330");
  await page.getByPlaceholder("660").fill("660");
  await page.getByRole("button", { name: /calculate/i }).click();

  const firstCard = page.getByRole("listitem").first();
  await expect(firstCard).toContainText(/Ω/);
  await expect(firstCard).toContainText("660Ω");
  await expect(firstCard).toContainText("330 + 330");
  const tierHeading = page.getByRole("heading", { level: 2 });
  await expect(tierHeading).toBeVisible();
  await expect(tierHeading).toHaveText(/resistors?/i);

  const calculateButton = page.getByRole("button", { name: /^> calculate$/i });
  const buttonBox = await calculateButton.boundingBox();
  const cardBox = await firstCard.boundingBox();

  expect(buttonBox).not.toBeNull();
  expect(cardBox).not.toBeNull();
  expect(cardBox!.y).toBeGreaterThan(buttonBox!.y);

  expect(messages).toEqual(
    expect.arrayContaining([
      expect.stringMatching(/^Found results: \d+$/),
      expect.stringMatching(/^Computation time: \d+\.\d{2}ms$/),
    ])
  );
});
