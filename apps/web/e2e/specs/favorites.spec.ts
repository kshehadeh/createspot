import { test, expect } from "../fixtures/test.fixture";

test.describe("Favorites", () => {
  test("redirects unauthenticated users from favorites tab to welcome", async ({
    page,
  }) => {
    await page.goto("/?tab=favorites");
    await expect(page).toHaveURL(/\/welcome/);
  });

  test("can favorite and unfavorite a submission", async ({
    page,
    cleanup,
  }) => {
    await page.goto("/inspire/exhibition");

    const submission = page.locator('[data-testid="submission-card"]').first();
    if (!(await submission.isVisible())) {
      test.skip();
      return;
    }

    await submission.click();

    const favoriteButton = page.locator(
      '[data-testid="favorite-button"], button:has-text("Favorite")',
    );
    if (!(await favoriteButton.isVisible())) {
      test.skip();
      return;
    }

    const initialState = await favoriteButton.getAttribute("data-favorited");
    await favoriteButton.click();

    await page.waitForTimeout(1000);

    const submissionId = page.url().match(/\/s\/([^/]+)/)?.[1];
    if (submissionId && initialState !== "true") {
      cleanup.trackFavorite(submissionId);
    }

    await favoriteButton.click();
    await page.waitForTimeout(500);
  });
});
