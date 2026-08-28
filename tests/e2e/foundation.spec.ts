import { expect, test } from "@playwright/test";

test("redirects a fresh deployment to the installer", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/install$/);
  await expect(page.getByRole("heading", { name: "Welcome" })).toBeVisible();
  await expect(page.getByText("لسان")).toBeVisible();
});
