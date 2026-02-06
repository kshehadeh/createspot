/**
 * Captures screenshots from the deployed Create Spot site (www.create.spot)
 * and saves them to apps/help/images/ for use in the help documentation.
 *
 * Run: bun run capture-screenshots
 *
 * Requires:
 * - bun install (playwright); first run may need: bunx playwright install chromium
 * - apps/help/.env with CREATE_SPOT_SCREENSHOT_USER and CREATE_SPOT_SCREENSHOT_PASSWORD
 *   (Google account used to log in; see .env.example)
 */

import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";
import { readFileSync, existsSync } from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HELP_DIR = path.join(__dirname, "..");
const BASE_URL = "https://www.create.spot";
const IMAGES_DIR = path.join(HELP_DIR, "images");

function loadEnv(): void {
  const envPath = path.join(HELP_DIR, ".env");
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("#") || !trimmed) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
      value = value.slice(1, -1).replace(/\\(.)/g, "$1");
    if (!process.env[key]) process.env[key] = value;
  }
}
loadEnv();

const USER = process.env.CREATE_SPOT_SCREENSHOT_USER;
const PASSWORD = process.env.CREATE_SPOT_SCREENSHOT_PASSWORD;

interface Capture {
  name: string;
  url: string;
  waitUntil?: "load" | "domcontentloaded" | "networkidle";
}

// Pages that don't require authentication (capture before login)
const publicCaptures: Capture[] = [
  { name: "homepage", url: "/", waitUntil: "networkidle" },
  { name: "sign-in", url: "/welcome", waitUntil: "networkidle" },
  { name: "exhibition-list", url: "/exhibition", waitUntil: "networkidle" },
];

// Pages that require authentication (capture after login)
const authCaptures: Capture[] = [
  { name: "this-week-gallery", url: "/prompt/this-week", waitUntil: "networkidle" },
  { name: "play-submit", url: "/prompt/play", waitUntil: "networkidle" },
  { name: "prompt-history", url: "/prompt/history", waitUntil: "networkidle" },
];

async function login(page: import("playwright").Page): Promise<boolean> {
  if (!USER || !PASSWORD) {
    console.warn(
      "CREATE_SPOT_SCREENSHOT_USER and CREATE_SPOT_SCREENSHOT_PASSWORD not set in .env; skipping login."
    );
    return false;
  }
  console.log("Logging in…");
  await page.goto(`${BASE_URL}/welcome`, { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: /continue with google/i }).click();
  await page.waitForURL(/accounts\.google\.com/, { timeout: 15000 });
  await page.waitForTimeout(500);
  await page.getByRole("textbox", { name: /email or phone/i }).fill(USER);
  await page.getByRole("button", { name: /next/i }).click();
  await page.waitForTimeout(1000);
  await page.getByRole("textbox", { name: /enter your password/i }).fill(PASSWORD);
  await page.getByRole("button", { name: /next/i }).click();
  await page.waitForURL((url) => url.origin === new URL(BASE_URL).origin, { timeout: 20000 }).catch(() => null);
  await page.waitForTimeout(1000);
  const loggedIn = page.url().startsWith(BASE_URL) && !page.url().includes("/welcome");
  if (loggedIn) console.log("Logged in.");
  else console.warn("Login may have failed; continuing unauthenticated.");
  return loggedIn;
}

async function capturePage(
  page: import("playwright").Page,
  name: string,
  url: string,
  waitUntil: "load" | "domcontentloaded" | "networkidle" = "networkidle"
): Promise<void> {
  const fullUrl = `${BASE_URL}${url}`;
  console.log(`Capturing ${name}: ${fullUrl}`);
  try {
    await page.goto(fullUrl, { waitUntil, timeout: 15000 });
    await page.waitForTimeout(800);
    const filepath = path.join(IMAGES_DIR, `${name}.png`);
    await page.screenshot({
      path: filepath,
    });
    console.log(`  -> ${filepath}`);
  } catch (err) {
    console.warn(`  Failed: ${err}`);
  }
}

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });

  // Create a fresh page for public captures (not logged in)
  const publicPage = await context.newPage();

  // Capture public pages first (before login)
  for (const { name, url, waitUntil } of publicCaptures) {
    await capturePage(publicPage, name, url, waitUntil);
  }

  await publicPage.close();

  // Now create a new page and log in for authenticated captures
  const page = await context.newPage();
  await login(page);

  // Capture authenticated pages
  for (const { name, url, waitUntil } of authCaptures) {
    await capturePage(page, name, url, waitUntil);
  }

  // Capture dropdown menus for navigation documentation
  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForTimeout(500);

    // Capture Explore dropdown
    const exploreTrigger = page.locator("button").filter({ hasText: /explore/i }).first();
    if (await exploreTrigger.isVisible().catch(() => false)) {
      await exploreTrigger.click();
      await page.waitForTimeout(400);
      console.log("Capturing nav-explore-dropdown");
      await page.screenshot({
        path: path.join(IMAGES_DIR, "nav-explore-dropdown.png"),
      });
      // Close dropdown by pressing Escape
      await page.keyboard.press("Escape");
      await page.waitForTimeout(200);
    }

    // Capture About dropdown
    const aboutTrigger = page.locator("button").filter({ hasText: /^about$/i }).first();
    if (await aboutTrigger.isVisible().catch(() => false)) {
      await aboutTrigger.click();
      await page.waitForTimeout(400);
      console.log("Capturing nav-about-dropdown");
      await page.screenshot({
        path: path.join(IMAGES_DIR, "nav-about-dropdown.png"),
      });
      await page.keyboard.press("Escape");
      await page.waitForTimeout(200);
    }

    // Capture My Hub dropdown (requires login)
    const myHubTrigger = page.locator("button").filter({ hasText: /my hub/i }).first();
    if (await myHubTrigger.isVisible().catch(() => false)) {
      await myHubTrigger.click();
      await page.waitForTimeout(400);
      console.log("Capturing nav-myhub-dropdown");
      await page.screenshot({
        path: path.join(IMAGES_DIR, "nav-myhub-dropdown.png"),
      });
      await page.keyboard.press("Escape");
      await page.waitForTimeout(200);
    }

    // Capture Admin dropdown (requires admin login)
    const adminTrigger = page.locator("button").filter({ hasText: /^admin$/i }).first();
    if (await adminTrigger.isVisible().catch(() => false)) {
      await adminTrigger.click();
      await page.waitForTimeout(400);
      console.log("Capturing nav-admin-dropdown");
      await page.screenshot({
        path: path.join(IMAGES_DIR, "nav-admin-dropdown.png"),
      });
      await page.keyboard.press("Escape");
      await page.waitForTimeout(200);
    }
  } catch (err) {
    console.warn("Dropdown navigation capture skipped:", err);
  }

  // Try to capture exhibit grid, path, and map views
  try {
    await page.goto(`${BASE_URL}/exhibition`, { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForTimeout(1000);
    const exhibitLink = await page
      .locator('a[href^="/exhibition/gallery/grid/"], a[href^="/exhibition/"]')
      .first()
      .getAttribute("href");
    if (exhibitLink) {
      const match = exhibitLink.match(/\/exhibition\/gallery\/(grid|path)\/([^/?#]+)/);
      const exhibitId = match ? match[2] : exhibitLink.split("/").filter(Boolean).pop();
      if (exhibitId) {
        for (const view of ["grid", "path"] as const) {
          const viewUrl = `/exhibition/gallery/${view}/${exhibitId}`;
          console.log(`Capturing exhibit-${view}: ${BASE_URL}${viewUrl}`);
          await page.goto(`${BASE_URL}${viewUrl}`, { waitUntil: "networkidle", timeout: 15000 });
          await page.waitForTimeout(800);
          await page.screenshot({
            path: path.join(IMAGES_DIR, `exhibit-${view}.png`),
          });
        }
      }
    }
    // Map view (global exhibition with world map)
    console.log(`Capturing exhibit-map: ${BASE_URL}/exhibition/global`);
    await page.goto(`${BASE_URL}/exhibition/global`, { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: path.join(IMAGES_DIR, "exhibit-map.png"),
    });
    // Map pin click: popup with artists at location
    const marker = page.locator(".leaflet-marker-icon").first();
    await marker.waitFor({ state: "visible", timeout: 10000 }).catch(() => null);
    if (await marker.isVisible()) {
      await marker.click();
      await page.waitForTimeout(800);
      const popup = page.locator(".leaflet-popup");
      await popup.waitFor({ state: "visible", timeout: 5000 }).catch(() => null);
      if (await popup.isVisible()) {
        console.log("Capturing exhibit-map-pin-popup");
        await page.screenshot({
          path: path.join(IMAGES_DIR, "exhibit-map-pin-popup.png"),
        });
        // Click a user in the popup to open the user work modal
        const userButton = page.locator(".leaflet-popup button").first();
        await userButton.click();
        await page.waitForTimeout(1000);
        const dialog = page.getByRole("dialog");
        await dialog.waitFor({ state: "visible", timeout: 5000 }).catch(() => null);
        if (await dialog.isVisible()) {
          console.log("Capturing exhibit-map-user-modal");
          await page.screenshot({
            path: path.join(IMAGES_DIR, "exhibit-map-user-modal.png"),
          });
        }
      }
    }
  } catch (err) {
    console.warn("Exhibit views capture skipped:", err);
  }

  // Profile editor (requires login: open My Hub dropdown -> Profile -> Edit profile)
  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForTimeout(500);

    // Look for "My Hub" dropdown trigger in the navigation
    const myHubTrigger = page.locator("button, a").filter({ hasText: /my hub|hub/i }).first();
    if (await myHubTrigger.isVisible().catch(() => false)) {
      await myHubTrigger.click();
      await page.waitForTimeout(400);

      // Click on "Profile" in the dropdown
      const profileLink = page.getByRole("menuitem", { name: /profile/i }).first();
      if (await profileLink.isVisible().catch(() => false)) {
        await profileLink.click();
        await page.waitForURL(/\/creators\//, { timeout: 10000 });
        await page.waitForTimeout(800);

        // Look for edit link/button on profile page
        const editLink = page.getByRole("link", { name: /edit profile|edit/i });
        if (await editLink.first().isVisible().catch(() => false)) {
          await editLink.first().click();
          await page.waitForURL(/\/creators\/[^/]+\/edit/, { timeout: 10000 });
          await page.waitForTimeout(800);
          console.log("Capturing profile-edit");
          await page.screenshot({
            path: path.join(IMAGES_DIR, "profile-edit.png"),
          });
        }
      }
    } else {
      console.warn("My Hub dropdown not found; skipping profile editor capture.");
    }
  } catch (err) {
    console.warn("Profile editor capture skipped:", err);
  }

  await browser.close();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
