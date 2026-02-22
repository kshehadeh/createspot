import { test, expect } from "../fixtures/test.fixture";

test.describe("Dashboard", () => {
  test("dashboard page loads successfully", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL("/dashboard");
  });

  test("shows prompt words when active prompt exists", async ({ page }) => {
    await page.goto("/dashboard");
    const promptSection = page.locator('[data-testid="current-prompt"]');
    if (await promptSection.isVisible()) {
      await expect(promptSection).toContainText(/\w+/);
    }
  });

  test("can navigate to play page", async ({ page }) => {
    await page.goto("/dashboard");
    const playLink = page.locator('a[href*="/inspire/prompt/play"]').first();
    await playLink.waitFor({ state: "visible", timeout: 10000 });
    await playLink.click();
    await expect(page).toHaveURL(/\/inspire\/prompt\/play/);
  });
});
