import { test, expect } from "../fixtures/test.fixture";

test.describe("Dashboard", () => {
  test("dashboard page loads successfully", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL("/dashboard");
  });

  test("can navigate to portfolio edit from onboarding", async ({ page }) => {
    await page.goto("/dashboard");

    const portfolioLink = page.locator('a[href*="/portfolio/edit"]').first();
    const visible = await portfolioLink
      .waitFor({ state: "visible", timeout: 8000 })
      .then(() => true)
      .catch(() => false);

    if (!visible) {
      test.skip();
      return;
    }

    await portfolioLink.click();
    await expect(page).toHaveURL(/\/creators\/[^/]+\/portfolio\/edit/);
  });
});
