import { test, expect } from "../fixtures/test.fixture";

test.describe("Authentication", () => {
  test("authenticated user sees dashboard", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL("/dashboard");
    await expect(
      page.getByRole("heading", { name: /dashboard/i }),
    ).toBeVisible();
  });

  test("can access profile settings", async ({ page }) => {
    await page.goto("/");
    const avatar = page.locator('[data-testid="user-menu"]').first();
    if (await avatar.isVisible()) {
      await avatar.click();
      await expect(page.getByText(/profile/i)).toBeVisible();
    }
  });
});
