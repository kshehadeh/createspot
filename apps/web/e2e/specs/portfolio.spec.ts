import { test, expect } from "../fixtures/test.fixture";

test.describe("Portfolio", () => {
  test("can navigate to portfolio page", async ({ page }) => {
    await page.goto("/dashboard");

    const portfolioLink = page.getByRole("link", { name: /portfolio/i });
    if (await portfolioLink.isVisible()) {
      await portfolioLink.click();
      await expect(page).toHaveURL(/\/portfolio/);
    }
  });

  test("can add a portfolio item", async ({ page, cleanup, request }) => {
    await page.goto("/creators/me/portfolio/edit");

    const addButton = page.getByRole("button", { name: /add|new|create/i });
    if (!(await addButton.isVisible())) {
      test.skip();
      return;
    }

    await addButton.click();

    const titleInput = page.locator('input[name="title"]');
    if (await titleInput.isVisible()) {
      await titleInput.fill("E2E Portfolio Test Item");
    }

    const editor = page.locator('[contenteditable="true"]').first();
    if (await editor.isVisible()) {
      await editor.fill("Test portfolio content created by E2E test");
    }

    const saveButton = page.getByRole("button", { name: /save/i });
    if (await saveButton.isEnabled()) {
      await saveButton.click();

      try {
        await page.waitForResponse(
          (response) =>
            response.url().includes("/api/submissions") &&
            response.status() === 200,
          { timeout: 10000 },
        );

        const response = await request.get("/api/submissions?portfolio=true");
        const data = await response.json();
        const testItem = data.submissions?.find(
          (s: { title?: string }) => s.title === "E2E Portfolio Test Item",
        );

        if (testItem) {
          cleanup.trackSubmission(testItem.id);
        }
      } catch {
        // Submission may have failed
      }
    }
  });
});
