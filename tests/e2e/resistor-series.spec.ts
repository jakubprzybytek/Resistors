import { test, expect } from "@playwright/test";

const PREDEFINED_TABS: { name: "E3" | "E6" | "E12" | "E24"; firstRow: RegExp; targets: number[] }[] = [
  { name: "E3", firstRow: /^1, 2\.2, 4\.7/, targets: [10, 660, 100_000] },
  { name: "E6", firstRow: /^1, 1\.5, 2\.2, 3\.3, 4\.7, 6\.8/, targets: [15, 470, 22_000] },
  { name: "E12", firstRow: /^1, 1\.2, 1\.5, 1\.8, 2\.2, 2\.7, 3\.3, 3\.9, 4\.7, 5\.6, 6\.8, 8\.2/, targets: [18, 390, 56_000] },
  { name: "E24", firstRow: /^1, 1\.1, 1\.2, 1\.3, 1\.5, 1\.6, 1\.8, 2, 2\.2, 2\.4, 2\.7, 3, 3\.3/, targets: [13, 240, 91_000] },
];

for (const { name, firstRow, targets } of PREDEFINED_TABS) {
  test(`${name} tab shows read-only generated values and calculates`, async ({ page }) => {
    await page.goto("/");

    await page.getByRole("tab", { name, exact: true }).click();

    const textarea = page.locator("textarea");
    await expect(textarea).toHaveAttribute("readonly", "");
    await expect(textarea).toHaveValue(firstRow);

    for (const target of targets) {
      await page.getByPlaceholder("660").fill(String(target));
      await page.getByRole("button", { name: /calculate/i }).click();

      const listItems = page.getByRole("listitem");
      await expect(listItems.first()).toBeVisible();
      await expect(listItems.first()).toContainText(/Ω/);
    }
  });
}

test("Custom tab accepts comma-separated values without suffixes", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("tab", { name: "Custom", exact: true }).click();
  await page.locator("textarea").fill("100, 220, 330");
  await page.getByPlaceholder("660").fill("660");
  await page.getByRole("button", { name: /calculate/i }).click();

  const listItems = page.getByRole("listitem");
  await expect(listItems.first()).toContainText("660.00Ω");
  await expect(page.getByText("330Ω + 330Ω")).toBeVisible();
});

test("Custom tab accepts newline-separated values", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("tab", { name: "Custom", exact: true }).click();
  await page.locator("textarea").fill("100\n220\n330");
  await page.getByPlaceholder("660").fill("330");
  await page.getByRole("button", { name: /calculate/i }).click();

  await expect(page.getByRole("listitem").first()).toContainText(/Ω/);
});

test("Custom tab accepts values with k/M suffixes, with and without spaces", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("tab", { name: "Custom", exact: true }).click();
  await page.locator("textarea").fill("100, 4.7k, 1 M");
  await page.getByPlaceholder("660").fill("4700");
  await page.getByRole("button", { name: /calculate/i }).click();

  await expect(page.getByRole("listitem").first()).toContainText("4700.00Ω");
  await expect(page.getByRole("listitem").first()).toContainText("4700");
});

test("Custom tab blocks calculation and reports invalid tokens", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("tab", { name: "Custom", exact: true }).click();
  await page.locator("textarea").fill("100, abc, 220");
  await page.getByPlaceholder("660").fill("220");
  await page.getByRole("button", { name: /calculate/i }).click();

  await expect(page.getByText(/invalid value\(s\): abc/i)).toBeVisible();
});

test("Custom tab retains typed values when switching tabs away and back", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("tab", { name: "Custom", exact: true }).click();
  await page.locator("textarea").fill("100, 220, 330");

  await page.getByRole("tab", { name: "E3", exact: true }).click();
  await page.getByRole("tab", { name: "Custom", exact: true }).click();

  await expect(page.locator("textarea")).toHaveValue("100, 220, 330");
});
