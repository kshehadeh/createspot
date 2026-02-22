import type { Page } from "@playwright/test";

const NAV_BASE = "/dashboard";

/**
 * Opens the "Create" (My Hub) dropdown in the header by clicking its trigger.
 * Call this before clicking Profile, Portfolio, or Collections links.
 * Radix renders dropdown items as role="menuitem" (even with asChild Link).
 */
export async function openCreateDropdown(page: Page): Promise<void> {
  const createTrigger = page.getByRole("button", { name: /create/i }).first();
  await createTrigger.waitFor({ state: "visible", timeout: 15000 });
  await createTrigger.click();
  await page.getByRole("menuitem", { name: /^profile$/i }).waitFor({ state: "visible", timeout: 5000 });
}

/**
 * Navigates to the logged-in user's profile page by opening the Create dropdown
 * and clicking the Profile link (avoids hardcoding /creators/me which does not exist).
 */
export async function goToOwnProfile(page: Page): Promise<void> {
  await page.goto(NAV_BASE);
  await openCreateDropdown(page);
  await page.getByRole("menuitem", { name: /^profile$/i }).click();
  await page.waitForURL(/\/creators\/[^/]+$/);
}

/**
 * Navigates to the logged-in user's portfolio page via the Create dropdown.
 */
export async function goToOwnPortfolio(page: Page): Promise<void> {
  await page.goto(NAV_BASE);
  await openCreateDropdown(page);
  await page.getByRole("menuitem", { name: /^portfolio$/i }).click();
  await page.waitForURL(/\/portfolio/);
}

/**
 * Navigates to the logged-in user's collections page via the Create dropdown.
 */
export async function goToOwnCollections(page: Page): Promise<void> {
  await page.goto(NAV_BASE);
  await openCreateDropdown(page);
  await page.getByRole("menuitem", { name: /^collections$/i }).click();
  await page.waitForURL(/\/collections/);
}

/**
 * Opens the user (avatar) dropdown in the header. Use before clicking Edit or Manage profile.
 */
export async function openUserDropdown(page: Page): Promise<void> {
  await page.goto(NAV_BASE);
  const userTrigger = page.locator("header").getByRole("button").last();
  await userTrigger.waitFor({ state: "visible", timeout: 15000 });
  await userTrigger.click();
  await page.getByRole("menuitem", { name: /edit/i }).waitFor({ state: "visible", timeout: 5000 });
}

/**
 * Navigates to the logged-in user's profile edit page by opening the user dropdown
 * and clicking the Edit link.
 */
export async function goToOwnProfileEdit(page: Page): Promise<void> {
  await openUserDropdown(page);
  await page.getByRole("menuitem", { name: /edit/i }).click();
  await page.waitForURL(/\/edit$/);
}

/**
 * Navigates to the logged-in user's portfolio edit page by going to portfolio
 * then clicking the "Add portfolio item" (or manage) link.
 */
export async function goToOwnPortfolioEdit(page: Page): Promise<void> {
  await goToOwnPortfolio(page);
  await page.getByRole("link", { name: /add portfolio item|manage portfolio/i }).first().click();
  await page.waitForURL(/\/portfolio\/edit/);
}
