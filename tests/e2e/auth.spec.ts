import { expect, test } from "@playwright/test";

test("signup form exposes the Phase 1 learner fields", async ({ page }) => {
  test.skip(!process.env.E2E_INSTALLED_APP, "Requires an installed disposable MySQL test application");
  await page.goto("/signup");
  await expect(page.getByRole("heading", { name: "শেখা শুরু করুন" })).toBeVisible();
  await expect(page.getByLabel("পুরো নাম")).toBeVisible();
  await expect(page.getByLabel("পাসওয়ার্ড আবার লিখুন")).toBeVisible();
});

test("student login, protected landing, and logout", async ({ page }) => {
  test.skip(!process.env.E2E_STUDENT_EMAIL || !process.env.E2E_STUDENT_PASSWORD, "Requires disposable seeded student credentials");
  await page.goto("/login");
  await page.getByLabel("ইমেইল").fill(process.env.E2E_STUDENT_EMAIL!);
  await page.getByLabel("পাসওয়ার্ড").fill(process.env.E2E_STUDENT_PASSWORD!);
  await page.getByRole("button", { name: "লগইন" }).click();
  await expect(page).toHaveURL(/\/learn/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/learn/);
  await page.getByRole("button", { name: "লগআউট" }).click();
  await expect(page).toHaveURL(/\/login/);
});
