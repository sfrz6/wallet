import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

/**
 * End-to-end acceptance journey (spec sections 58 and 79).
 *
 * Prerequisites (see README "End-to-end tests"):
 *   - A running app against a real DATABASE_URL.
 *   - DEV_EMAIL_FALLBACK=true and E2E_CODE_FILE=<path> so the verification code
 *     is written to a file this test can read (never enabled in production).
 *
 * Run: E2E_CODE_FILE=./e2e-codes.txt npm run build && npm run start   (server)
 *      then: E2E_CODE_FILE=./e2e-codes.txt npm run test:e2e
 */

const CODE_FILE = process.env.E2E_CODE_FILE ?? "./e2e-codes.txt";

function latestCodeFor(email: string): string {
  const lines = readFileSync(CODE_FILE, "utf8").trim().split(/\r?\n/);
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i] ?? "";
    if (line.startsWith(`${email}:`)) {
      const code = line.slice(email.length + 1);
      if (code) return code;
    }
  }
  throw new Error(`No verification code found for ${email}`);
}

test("new user signs up, verifies, onboards, records a transaction, and returns without onboarding", async ({
  page,
}) => {
  const unique = Date.now();
  const username = `mohammed${unique}`;
  const email = `mohammed${unique}@example.com`;
  const password = "strongpass123";

  // Sign up
  await page.goto("/signup");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();

  // Verify
  await page.waitForURL("**/verify");
  const code = latestCodeFor(email);
  await page.getByLabel("Verification code").fill(code);
  await page.getByRole("button", { name: "Verify" }).click();

  // Onboarding: add a debit account
  await page.waitForURL("**/onboarding");
  await page.getByLabel("Account name").fill("Daily");
  await page.getByLabel("Opening balance").fill("1000");
  await page.getByRole("button", { name: "Add account" }).click();
  await expect(page.getByText("Daily")).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();

  // Onboarding: add a category then finish
  await page.getByLabel("Category name").fill("Food");
  await page.getByRole("button", { name: "Add category" }).click();
  await page.getByRole("button", { name: "Finish setup" }).click();

  // Dashboard
  await page.waitForURL("**/dashboard");
  await expect(page.getByText("Total cash")).toBeVisible();

  // Add an expense via quick add
  await page.getByRole("button", { name: "Add transaction" }).first().click();
  await page.getByRole("button", { name: /Expense/ }).first().click();
  await page.getByLabel("Account").selectOption({ label: "Daily" });
  await page.getByLabel("Category").selectOption({ label: "Food" });
  await page.getByLabel("Amount").fill("5");
  await page.getByRole("button", { name: "Save" }).click();

  // Balance should reflect the expense (995.000)
  await expect(page.getByText(/995\.000/)).toBeVisible();

  // Log out
  await page.getByRole("button", { name: "Sign out" }).first().click();
  await page.waitForURL("**/login");

  // Log back in: should go straight to dashboard, no onboarding
  await page.getByLabel("Username or email").fill(username);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard");
  await expect(page).toHaveURL(/\/dashboard/);
});
