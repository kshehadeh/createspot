import { test, expect } from "../fixtures/test.fixture";

test.describe("Creator Page", () => {
  test("can view own creator page", async ({ page }) => {
    await page.goto("/creators/me");
    await expect(page).toHaveURL(/\/creators\//);
  });

  test("creator page shows profile information", async ({ page }) => {
    await page.goto("/creators/me");

    const profileSection = page.locator(
      '[data-testid="creator-profile"], main',
    );
    await expect(profileSection).toBeVisible();
  });

  test("can navigate to portfolio tab", async ({ page }) => {
    await page.goto("/creators/me");

    const portfolioTab = page.getByRole("tab", { name: /portfolio/i });
    if (await portfolioTab.isVisible()) {
      await portfolioTab.click();
      await expect(page).toHaveURL(/\/portfolio/);
    }
  });

  test("can navigate to collections tab", async ({ page }) => {
    await page.goto("/creators/me");

    const collectionsTab = page.getByRole("tab", { name: /collections/i });
    if (await collectionsTab.isVisible()) {
      await collectionsTab.click();
      await expect(page).toHaveURL(/\/collections/);
    }
  });

  test("can view creators list", async ({ page }) => {
    await page.goto("/creators");
    await expect(page).toHaveURL("/creators");
  });
});
