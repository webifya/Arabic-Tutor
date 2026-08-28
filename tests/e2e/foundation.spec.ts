import { expect, test } from "@playwright/test";

test("shows the Phase 0 foundation", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText("لسان")).toBeVisible();
});
