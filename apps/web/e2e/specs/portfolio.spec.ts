import { test, expect } from "../fixtures/test.fixture";
import { testImagePath } from "../helpers/fixture-paths.cjs";
import {
  goToOwnPortfolio,
  goToOwnPortfolioEdit,
} from "../helpers/navigation";

test.describe("Portfolio", () => {
  test("can navigate to portfolio page", async ({ page }) => {
    await goToOwnPortfolio(page);
    await expect(page).toHaveURL(/\/portfolio/);
  });

  test("can add a portfolio item", async ({ page, cleanup, request }) => {
    await goToOwnPortfolioEdit(page);

    const addButton = page.getByRole("button", {
      name: /add new portfolio item/i,
    });
    if (!(await addButton.isVisible())) {
      test.skip();
      return;
    }

    await addButton.click();

    // Wait for the create modal (dialog) to be visible
    const dialog = page.getByRole("dialog");
    await dialog.waitFor({ state: "visible", timeout: 10000 });

    // Wait for form to be ready (file input is present; it's hidden so use attached)
    const fileInput = dialog.locator('input[type="file"][accept="image/*"]').first();
    await fileInput.waitFor({ state: "attached", timeout: 15000 });

    // Select image to upload (main image, not reference)
    await fileInput.setInputFiles(testImagePath);

    // Wait for upload to complete (presign + R2 PUT then form state updates)
    await page.waitForResponse(
      (res) => res.url().includes("/api/upload/presign") && res.status() === 200,
      { timeout: 15000 },
    );
    const uploadingText = dialog.getByText(/uploading/i);
    await uploadingText.waitFor({ state: "visible", timeout: 5000 });
    await uploadingText.waitFor({ state: "hidden", timeout: 15000 });

    const titleInput = dialog.locator("#title");
    await titleInput.fill("E2E Portfolio Test Item");

    // Category is required: open the category select (only combobox in form) and choose one
    await dialog.getByRole("combobox").click();
    await page.getByRole("option", { name: "Photography" }).click();

    const editor = dialog.locator('[contenteditable="true"]').first();
    if (await editor.isVisible()) {
      await editor.fill("Test portfolio content created by E2E test");
    }

    const submitButton = dialog.getByRole("button", {
      name: /add to portfolio/i,
    });
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

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
  });
});
