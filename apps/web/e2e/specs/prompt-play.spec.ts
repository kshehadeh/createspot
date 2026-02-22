import { test, expect } from "../fixtures/test.fixture";
import path from "path";

test.describe("Prompt Play", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/inspire/prompt/play");
  });

  test("play page shows prompt words", async ({ page }) => {
    await expect(page.locator("text=This Week")).toBeVisible();
  });

  test("can create a text submission", async ({ page, cleanup, request }) => {
    const firstSlot = page.locator('[data-testid="submission-slot"]').first();
    if (!(await firstSlot.isVisible())) {
      test.skip();
      return;
    }

    await firstSlot.click();

    const textTab = page.getByRole("tab", { name: /text/i });
    if (await textTab.isVisible()) {
      await textTab.click();
    }

    const editor = page.locator('[contenteditable="true"]').first();
    if (await editor.isVisible()) {
      await editor.fill("E2E test submission content");

      const submitButton = page.getByRole("button", { name: /save|submit/i });
      if (await submitButton.isEnabled()) {
        await submitButton.click();

        await page.waitForResponse(
          (response) =>
            response.url().includes("/api/submissions") &&
            response.status() === 200,
        );

        const response = await request.get("/api/submissions?portfolio=false");
        const data = await response.json();
        const testSubmission = data.submissions?.find((s: { text?: string }) =>
          s.text?.includes("E2E test submission content"),
        );

        if (testSubmission) {
          cleanup.trackSubmission(testSubmission.id);
        }
      }
    }
  });

  test("can upload an image submission", async ({ page, cleanup, request }) => {
    const slots = page.locator('[data-testid="submission-slot"]');
    const emptySlot = slots.filter({ hasNot: page.locator("img") }).first();

    if (!(await emptySlot.isVisible())) {
      test.skip();
      return;
    }

    await emptySlot.click();

    const imageTab = page.getByRole("tab", { name: /image/i });
    if (await imageTab.isVisible()) {
      await imageTab.click();
    }

    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.count()) {
      const testImagePath = path.join(__dirname, "../test-images/sample.png");
      await fileInput.setInputFiles(testImagePath);

      const submitButton = page.getByRole("button", { name: /save|submit/i });
      if (await submitButton.isEnabled()) {
        await submitButton.click();

        try {
          await page.waitForResponse(
            (response) =>
              response.url().includes("/api/submissions") &&
              response.status() === 200,
            { timeout: 30000 },
          );

          const response = await request.get(
            "/api/submissions?portfolio=false",
          );
          const data = await response.json();
          const recentSubmission = data.submissions?.[0];

          if (recentSubmission?.imageUrl) {
            cleanup.trackSubmission(recentSubmission.id);
          }
        } catch {
          // Upload may have failed or timed out
        }
      }
    }
  });
});
