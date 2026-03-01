/**
 * Captures screenshots from the local dev server and saves them to
 * apps/help/images/ for use in the help documentation.
 *
 * Run: bun run capture-screenshots
 *
 * Prerequisites:
 * - bun install (playwright); first run may need: bunx playwright install chromium
 * - The dev server running locally (bun run dev)
 * - apps/help/.env (or root .env) with E2E_USER_EMAIL, E2E_USER_PASSWORD,
 *   and E2E_BOOTSTRAP_SECRET (credentials-based login for automation)
 */

import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";
import { readFileSync, existsSync } from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HELP_DIR = path.join(__dirname, "..");
const BASE_URL = process.env.SCREENSHOT_BASE_URL || "http://localhost:3000";
const IMAGES_DIR = path.join(HELP_DIR, "images");

function loadEnvFile(filePath: string): void {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, "utf8");
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
// Load help-specific .env first, then fall back to root .env for shared E2E vars
loadEnvFile(path.join(HELP_DIR, ".env"));
loadEnvFile(path.join(HELP_DIR, "../../.env"));

const USER = process.env.E2E_USER_EMAIL;
const PASSWORD = process.env.E2E_USER_PASSWORD;
const BOOTSTRAP_SECRET = process.env.E2E_BOOTSTRAP_SECRET;

interface Capture {
  name: string;
  url: string;
  waitUntil?: "load" | "domcontentloaded" | "networkidle";
}

// Pages that don't require authentication (capture before login)
const publicCaptures: Capture[] = [
  { name: "homepage", url: "/", waitUntil: "networkidle" },
  { name: "sign-in", url: "/welcome", waitUntil: "networkidle" },
  { name: "exhibition-list", url: "/inspire/exhibition", waitUntil: "networkidle" },
];

// Pages that require authentication (capture after login)
const authCaptures: Capture[] = [
  { name: "dashboard", url: "/dashboard", waitUntil: "networkidle" },
  { name: "this-week-gallery", url: "/inspire/prompt/this-week", waitUntil: "networkidle" },
  { name: "play-submit", url: "/inspire/prompt/play", waitUntil: "networkidle" },
  { name: "prompt-history", url: "/inspire/prompt/history", waitUntil: "networkidle" },
  { name: "community", url: "/inspire/community", waitUntil: "networkidle" },
];

async function login(
  context: import("playwright").BrowserContext,
  page: import("playwright").Page
): Promise<boolean> {
  if (!USER || !PASSWORD || !BOOTSTRAP_SECRET) {
    console.warn(
      "E2E_USER_EMAIL, E2E_USER_PASSWORD, or E2E_BOOTSTRAP_SECRET not set in .env; skipping login."
    );
    return false;
  }
  console.log("Logging in via API…");

  const normalizedEmail = USER.trim().toLowerCase();

  try {
    // Helper to parse Set-Cookie headers into Playwright cookie objects
    const baseUrl = new URL(BASE_URL);
    function parseCookieHeaders(headers: Headers) {
      const parsed: Array<{
        name: string;
        value: string;
        domain: string;
        path: string;
        httpOnly: boolean;
        secure: boolean;
        sameSite: "Strict" | "Lax" | "None";
      }> = [];
      for (const header of headers.getSetCookie?.() ?? []) {
        const parts = header.split(";").map((p) => p.trim());
        const [nameValue, ...attrs] = parts;
        const eqIdx = nameValue.indexOf("=");
        if (eqIdx === -1) continue;
        const name = nameValue.slice(0, eqIdx);
        const value = nameValue.slice(eqIdx + 1);
        let cookiePath = "/";
        let httpOnly = false;
        let secure = false;
        let sameSite: "Strict" | "Lax" | "None" = "Lax";
        for (const attr of attrs) {
          const lower = attr.toLowerCase();
          if (lower.startsWith("path=")) cookiePath = attr.slice(5);
          else if (lower === "httponly") httpOnly = true;
          else if (lower === "secure") secure = true;
          else if (lower.startsWith("samesite=")) {
            const v = attr.slice(9).toLowerCase();
            if (v === "strict") sameSite = "Strict";
            else if (v === "none") sameSite = "None";
            else sameSite = "Lax";
          }
        }
        parsed.push({ name, value, domain: baseUrl.hostname, path: cookiePath, httpOnly, secure, sameSite });
      }
      return parsed;
    }

    // Build a Cookie header string from parsed cookie objects
    function cookieHeader(cookies: Array<{ name: string; value: string }>) {
      return cookies.map((c) => `${c.name}=${c.value}`).join("; ");
    }

    // Bootstrap the test user
    const bootstrapRes = await fetch(`${BASE_URL}/api/test/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${BOOTSTRAP_SECRET}`,
      },
      body: JSON.stringify({ email: normalizedEmail, password: PASSWORD }),
    });
    if (!bootstrapRes.ok) {
      const body = await bootstrapRes.text();
      throw new Error(`Bootstrap API failed: ${bootstrapRes.status} ${body}`);
    }

    // Get CSRF token -- also captures the csrf + callback-url cookies
    const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
    const csrfCookies = parseCookieHeaders(csrfRes.headers);
    const { csrfToken } = (await csrfRes.json()) as { csrfToken?: string };
    if (!csrfToken) {
      throw new Error("Failed to get CSRF token");
    }

    // Sign in via credentials, forwarding the CSRF cookies
    const signInRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Auth-Return-Redirect": "1",
        Cookie: cookieHeader(csrfCookies),
      },
      body: new URLSearchParams({
        csrfToken,
        callbackUrl: BASE_URL,
        username: normalizedEmail,
        password: PASSWORD!,
      }),
      redirect: "manual",
    });

    // Collect all cookies (csrf + session) and inject into the browser context
    const allCookies = [...csrfCookies, ...parseCookieHeaders(signInRes.headers)];
    if (allCookies.length > 0) {
      await context.addCookies(allCookies);
    }

    // Verify the session is established by navigating to the dashboard
    await page.goto("/dashboard", { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForTimeout(500);

    // Confirm we're actually logged in (not redirected to /welcome)
    if (page.url().includes("/welcome")) {
      throw new Error("Session not established: redirected to /welcome");
    }

    console.log("Logged in.");
    return true;
  } catch (error) {
    console.warn("Login may have failed; continuing unauthenticated.", error);
    return false;
  }
}

async function capturePage(
  page: import("playwright").Page,
  name: string,
  url: string,
  waitUntil: "load" | "domcontentloaded" | "networkidle" = "networkidle"
): Promise<void> {
  console.log(`Capturing ${name}: ${url}`);
  try {
    await page.goto(url, { waitUntil, timeout: 15000 });
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
    baseURL: BASE_URL,
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
  await login(context, page);

  // Capture authenticated pages
  for (const { name, url, waitUntil } of authCaptures) {
    await capturePage(page, name, url, waitUntil);
  }

  // Capture dropdown menus for navigation documentation
  try {
    await page.goto("/", { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForTimeout(500);

    // Capture Inspire dropdown
    const inspireTrigger = page.locator("button").filter({ hasText: /inspire/i }).first();
    if (await inspireTrigger.isVisible().catch(() => false)) {
      await inspireTrigger.click();
      await page.waitForTimeout(400);
      console.log("Capturing nav-inspire-dropdown");
      await page.screenshot({
        path: path.join(IMAGES_DIR, "nav-inspire-dropdown.png"),
      });
      await page.keyboard.press("Escape");
      await page.waitForTimeout(200);
    }

    // Capture Support dropdown
    const supportTrigger = page.locator("button").filter({ hasText: /support/i }).first();
    if (await supportTrigger.isVisible().catch(() => false)) {
      await supportTrigger.click();
      await page.waitForTimeout(400);
      console.log("Capturing nav-support-dropdown");
      await page.screenshot({
        path: path.join(IMAGES_DIR, "nav-support-dropdown.png"),
      });
      await page.keyboard.press("Escape");
      await page.waitForTimeout(200);
    }
  } catch (err) {
    console.warn("Dropdown navigation capture skipped:", err);
  }

  // Try to capture exhibit grid, path, and map views
  try {
    await page.goto("/inspire/exhibition", { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForTimeout(1000);
    const exhibitLink = await page
      .locator('a[href^="/inspire/exhibition/gallery/grid/"], a[href^="/inspire/exhibition/"]')
      .first()
      .getAttribute("href");
    if (exhibitLink) {
      const match = exhibitLink.match(/\/inspire\/exhibition\/gallery\/(grid|path)\/([^/?#]+)/);
      const exhibitId = match ? match[2] : exhibitLink.split("/").filter(Boolean).pop();
      if (exhibitId) {
        for (const view of ["grid", "path"] as const) {
          const viewUrl = `/inspire/exhibition/gallery/${view}/${exhibitId}`;
          console.log(`Capturing exhibit-${view}: ${viewUrl}`);
          await page.goto(viewUrl, { waitUntil: "networkidle", timeout: 15000 });
          await page.waitForTimeout(800);
          await page.screenshot({
            path: path.join(IMAGES_DIR, `exhibit-${view}.png`),
          });
        }
      }
    }
    // Map view (global exhibition with world map)
    console.log("Capturing exhibit-map: /inspire/exhibition/global");
    await page.goto("/inspire/exhibition/global", { waitUntil: "networkidle", timeout: 15000 });
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
    await page.goto("/", { waitUntil: "networkidle", timeout: 15000 });
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
