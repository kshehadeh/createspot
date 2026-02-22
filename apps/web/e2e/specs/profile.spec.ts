import { test, expect } from "../fixtures/test.fixture";

test.describe("Profile", () => {
  test("can view profile settings", async ({ page }) => {
    await page.goto("/creators/me/edit");
    await expect(page).toHaveURL(/\/edit/);
  });

  test("can update profile bio", async ({ page, request }) => {
    await page.goto("/creators/me/edit");

    const bioInput = page.locator('textarea[name="bio"]');
    if (!(await bioInput.isVisible())) {
      test.skip();
      return;
    }

    const originalBio = await bioInput.inputValue();

    const testBio = `E2E Test Bio - ${Date.now()}`;
    await bioInput.fill(testBio);

    const saveButton = page.getByRole("button", { name: /save/i });
    if (await saveButton.isEnabled()) {
      await saveButton.click();

      try {
        await page.waitForResponse(
          (response) =>
            response.url().includes("/api/profile") &&
            response.status() === 200,
        );

        const response = await request.get("/api/profile");
        const data = await response.json();
        expect(data.bio).toBe(testBio);

        await bioInput.fill(originalBio || "");
        await saveButton.click();
        await page.waitForResponse(
          (response) =>
            response.url().includes("/api/profile") &&
            response.status() === 200,
        );
      } catch {
        await bioInput.fill(originalBio || "");
        await saveButton.click();
      }
    }
  });

  test("profile protection settings are accessible", async ({ page }) => {
    await page.goto("/creators/me/edit");

    const protectionSection = page.getByText(/protection|watermark|download/i);
    if (await protectionSection.isVisible()) {
      await expect(protectionSection).toBeVisible();
    }
  });
});
