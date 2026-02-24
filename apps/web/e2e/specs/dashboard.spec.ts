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

    // Play link may be on dashboard (onboarding section) or we go via Inspire → Prompts
    const playLinkOnDashboard = page
      .locator('a[href*="/inspire/prompt/play"]')
      .first();
    const visible = await playLinkOnDashboard
      .waitFor({ state: "visible", timeout: 8000 })
      .then(() => true)
      .catch(() => false);

    if (visible) {
      await playLinkOnDashboard.click();
    } else {
      // Onboarding hidden (dismissed or complete): use nav Inspire → Prompts, then Play
      await page.getByRole("button", { name: /inspire/i }).click();
      await page.getByRole("menuitem", { name: /prompts/i }).click();
      await expect(page).toHaveURL(/\/inspire\/prompt/);
      await page.locator('a[href*="/inspire/prompt/play"]').first().click();
    }

    await expect(page).toHaveURL(/\/inspire\/prompt\/play/);
  });
});
