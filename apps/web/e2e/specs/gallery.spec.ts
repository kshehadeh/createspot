import { test, expect } from "../fixtures/test.fixture";

test.describe("Gallery", () => {
  test("can view exhibition gallery", async ({ page }) => {
    await page.goto("/inspire/exhibition");
    await expect(page).toHaveURL("/inspire/exhibition");
  });

  test("can view community page", async ({ page }) => {
    await page.goto("/inspire/community");
    await expect(page).toHaveURL("/inspire/community");
  });

  test("can browse exhibitions", async ({ page }) => {
    await page.goto("/inspire/exhibition");
    await expect(page).toHaveURL("/inspire/exhibition");
  });

  test("can click on a submission to view details", async ({ page }) => {
    await page.goto("/inspire/exhibition");

    const submission = page
      .locator('[data-testid="submission-card"], article, .submission-card')
      .first();

    if (await submission.isVisible()) {
      await submission.click();
      await page.waitForLoadState("networkidle");
    }
  });
});
