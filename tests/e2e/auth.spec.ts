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

test("new student completes onboarding and reaches the course overview", async ({ page }) => {
  test.skip(
    !process.env.E2E_ONBOARDING_EMAIL || !process.env.E2E_ONBOARDING_PASSWORD,
    "Requires a disposable student whose onboarding is not started",
  );

  await page.goto("/login");
  await page.getByLabel("ইমেইল").fill(process.env.E2E_ONBOARDING_EMAIL!);
  await page.getByLabel("পাসওয়ার্ড").fill(process.env.E2E_ONBOARDING_PASSWORD!);
  await page.getByRole("button", { name: "লগইন" }).click();
  await expect(page).toHaveURL(/\/learn\/onboarding/);

  await page.getByRole("button", { name: "একদম নতুন" }).click();
  await page.getByRole("button", { name: "পরের ধাপ" }).click();
  await page.getByRole("button", { name: "সাধারণ শিক্ষা" }).click();
  await page.getByRole("button", { name: "পরের ধাপ" }).click();
  await page.getByRole("button", { name: "10 মিনিট" }).click();
  await page.getByRole("button", { name: "পরের ধাপ" }).click();
  await page.getByRole("button", { name: "স্ট্যান্ডার্ড" }).click();
  await page.getByRole("button", { name: "শেখা শুরু করুন" }).click();

  await expect(page).toHaveURL(/\/learn$/);
  await expect(page.getByRole("heading", { name: /আসসালামু আলাইকুম/ })).toBeVisible();
  await page.getByRole("link", { name: "কোর্স দেখুন" }).click();
  await expect(page).toHaveURL(/\/learn\/course\/arabic-foundation-bn/);
  await expect(page.getByText("বাংলা")).toBeVisible();
  await expect(page.getByText("العربية")).toBeVisible();
  await page.getByRole("link", { name: /আরবি লেখা: প্রথম পরিচয়/ }).click();
  await expect(page).toHaveURL(/\/learn\/lesson\/c3_l01/);
  await page.getByLabel("বাম থেকে ডানে").check();
  await page.getByRole("button", { name: "উত্তর যাচাই করুন" }).click();
  await expect(page.getByText(/সঠিক নয়/)).toBeVisible();
  await page.getByLabel("ডান থেকে বামে").check();
  await page.getByRole("button", { name: "উত্তর যাচাই করুন" }).click();
  await expect(page.getByText(/সঠিক উত্তর/)).toBeVisible();
  await page.getByRole("button", { name: "পাঠ সম্পন্ন করুন" }).click();
  await expect(page).toHaveURL(/\/learn\/lesson\/c3_l02/);
  await expect(page.getByText("ا")).toBeVisible();
});
