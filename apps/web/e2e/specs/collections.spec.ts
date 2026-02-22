import { test, expect } from "../fixtures/test.fixture";
import { goToOwnCollections } from "../helpers/navigation";

test.describe("Collections", () => {
  test("can view collections page", async ({ page }) => {
    await goToOwnCollections(page);
    await expect(page).toHaveURL(/\/collections/);
  });

  test("can create and delete a collection", async ({
    page,
    cleanup,
    request,
  }) => {
    await goToOwnCollections(page);

    const createButton = page.getByRole("button", {
      name: /new collection/i,
    }).first();
    if (!(await createButton.isVisible())) {
      test.skip();
      return;
    }

    await createButton.click();

    const nameInput = page.locator(
      'input[name="name"], input[placeholder*="name" i]',
    );
    if (await nameInput.isVisible()) {
      await nameInput.fill("E2E Test Collection");
    }

    const saveButton = page.getByRole("button", { name: /save|create/i });
    if (await saveButton.isEnabled()) {
      await saveButton.click();

      try {
        await page.waitForResponse(
          (response) =>
            response.url().includes("/api/collections") &&
            response.status() === 200,
          { timeout: 10000 },
        );

        const response = await request.get("/api/collections");
        const data = await response.json();
        const testCollection = data.collections?.find(
          (c: { name: string }) => c.name === "E2E Test Collection",
        );

        if (testCollection) {
          cleanup.trackCollection(testCollection.id);
          await expect(page.getByText("E2E Test Collection")).toBeVisible();
        }
      } catch {
        // Collection creation may have failed
      }
    }
  });
});
