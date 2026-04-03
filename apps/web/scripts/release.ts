#!/usr/bin/env bun

/**
 * Complete release workflow orchestration.
 *
 * Steps:
 * 1. Commit any pending changes (using git-commit skill)
 * 2. Prepare changelog and bump version (using changelog and version-bump skills)
 * 3. Commit changelog/version changes
 * 4. Push to remote
 * 5. Post changelog to Discord
 *
 * Usage:
 *   bun scripts/release.ts
 *
 * Environment Variables:
 *   DISCORD_WEBHOOK_URL - Discord webhook URL for the announcements channel (required)
 */

import { spawn } from "child_process";
import { existsSync } from "fs";
import { readdir, readFile } from "fs/promises";
import { join } from "path";

interface ChangelogEntry {
  time: string;
  commit: string;
  type: "fix" | "improvement" | "feature" | "documentation";
  area:
    | "global"
    | "content"
    | "profile"
    | "portfolio"
    | "collection"
    | "games"
    | "tools";
  description: string;
}

const TYPE_EMOJIS: Record<ChangelogEntry["type"], string> = {
  fix: "🐛",
  improvement: "✨",
  feature: "🚀",
  documentation: "📚",
};

const AREA_NAMES: Record<ChangelogEntry["area"], string> = {
  global: "Global",
  content: "Content",
  profile: "Profile",
  portfolio: "Portfolio",
  collection: "Collection",
  games: "Games",
  tools: "Tools",
};

function getChangelogsDir(): string {
  const cwd = process.cwd();
  const localPath = join(cwd, "changelogs");
  if (existsSync(localPath)) {
    return localPath;
  }

  const monorepoPath = join(cwd, "apps", "web", "changelogs");
  if (existsSync(monorepoPath)) {
    return monorepoPath;
  }

  return localPath;
}

async function findMostRecentChangelog(): Promise<string | null> {
  const changelogsDir = getChangelogsDir();
  try {
    const files = await readdir(changelogsDir);
    const jsonFiles = files
      .filter((file) => file.endsWith(".json"))
      .sort()
      .reverse();

    if (jsonFiles.length === 0) {
      return null;
    }

    return join(changelogsDir, jsonFiles[0]);
  } catch (error) {
    console.error(`Error reading changelogs directory: ${error}`);
    return null;
  }
}

async function loadChangelogEntries(
  filePath: string,
): Promise<ChangelogEntry[]> {
  try {
    const content = await readFile(filePath, "utf-8");
    const entries: ChangelogEntry[] = JSON.parse(content);
    return entries;
  } catch (error) {
    console.error(`Error parsing changelog file: ${error}`);
    return [];
  }
}

function formatDate(dateStr: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split("-");
    const date = new Date(
      parseInt(year, 10),
      parseInt(month, 10) - 1,
      parseInt(day, 10),
    );
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function groupEntriesByType(
  entries: ChangelogEntry[],
): Map<ChangelogEntry["type"], ChangelogEntry[]> {
  const grouped = new Map<ChangelogEntry["type"], ChangelogEntry[]>();

  for (const entry of entries) {
    const existing = grouped.get(entry.type) || [];
    existing.push(entry);
    grouped.set(entry.type, existing);
  }

  return grouped;
}

function formatChangelogMessage(
  entries: ChangelogEntry[],
  date: string,
): string {
  if (entries.length === 0) {
    return `**No changes found for ${date}**`;
  }

  const formattedDate = formatDate(date);
  let message = `## 📋 Updates for ${formattedDate}\n\n`;

  const grouped = groupEntriesByType(entries);
  const typeOrder: ChangelogEntry["type"][] = [
    "feature",
    "improvement",
    "fix",
    "documentation",
  ];

  for (const type of typeOrder) {
    const typeEntries = grouped.get(type);
    if (!typeEntries || typeEntries.length === 0) {
      continue;
    }

    const emoji = TYPE_EMOJIS[type];
    const typeName = type.charAt(0).toUpperCase() + type.slice(1);
    message += `### ${emoji} ${typeName}s\n\n`;

    const areaGroups = new Map<ChangelogEntry["area"], ChangelogEntry[]>();
    for (const entry of typeEntries) {
      const existing = areaGroups.get(entry.area) || [];
      existing.push(entry);
      areaGroups.set(entry.area, existing);
    }

    for (const [area, areaEntries] of areaGroups.entries()) {
      const areaName = AREA_NAMES[area];
      message += `**${areaName}**\n`;
      for (const entry of areaEntries) {
        message += `• ${entry.description}\n`;
      }
      message += "\n";
    }
  }

  return message;
}

async function postToDiscord(message: string): Promise<void> {
  const webhookUrl = process.env["DISCORD_WEBHOOK_URL"];

  if (!webhookUrl) {
    throw new Error("DISCORD_WEBHOOK_URL environment variable is required");
  }

  if (!webhookUrl.startsWith("https://discord.com/api/webhooks/")) {
    throw new Error(
      "Invalid webhook URL format. Expected: https://discord.com/api/webhooks/{id}/{token}",
    );
  }

  const maxLength = 2000;
  const messages = [];

  if (message.length <= maxLength) {
    messages.push(message);
  } else {
    const sections = message.split(/\n\n+/);
    let currentMessage = "";

    for (const section of sections) {
      if ((currentMessage + section + "\n\n").length > maxLength) {
        if (currentMessage) {
          messages.push(currentMessage.trim());
        }
        currentMessage = section + "\n\n";
      } else {
        currentMessage += section + "\n\n";
      }
    }

    if (currentMessage) {
      messages.push(currentMessage.trim());
    }
  }

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const isFirst = i === 0;
    const isLast = i === messages.length - 1;

    let finalMessage = msg;
    if (!isFirst) {
      finalMessage = `*(continued...)*\n\n${finalMessage}`;
    }
    if (!isLast) {
      finalMessage = `${finalMessage}\n\n*(continued...)*`;
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: finalMessage,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to post to Discord: ${response.status} ${response.statusText}\n${errorText}`,
      );
    }

    await response.text();
    console.log(`✅ Posted message ${i + 1}/${messages.length} to Discord`);

    if (!isLast) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

async function main(): Promise<void> {
  console.log("🚀 Starting release workflow...\n");

  // Step 1: Commit pending changes
  console.log("📝 Step 1: Committing pending changes...");
  console.log("ℹ️  Use the git-commit skill to commit any pending changes.\n");

  // Step 2: Prepare changelog and bump version
  console.log("📚 Step 2: Preparing changelog and bumping version...");
  console.log(
    "ℹ️  Use the changelog and version-bump skills to update version and changelog.\n",
  );

  // Step 3: Commit changelog/version
  console.log("💾 Step 3: Committing changelog and version bump changes...");
  console.log("ℹ️  Create a commit for the changelog and version changes.\n");

  // Step 4: Push to remote
  console.log("🌐 Step 4: Pushing to remote...");
  console.log("ℹ️  Run: git push\n");

  // Step 5: Post to Discord
  console.log("📢 Step 5: Posting changelog to Discord...");

  try {
    const changelogPath = await findMostRecentChangelog();
    if (!changelogPath) {
      throw new Error("❌ No changelog files found in changelogs directory");
    }

    const filename = changelogPath.split("/").pop()?.replace(".json", "");
    const date = filename || "unknown";

    console.log(`📖 Reading changelog from: ${changelogPath}`);

    const entries = await loadChangelogEntries(changelogPath);
    if (entries.length === 0) {
      throw new Error("❌ No changelog entries found in file");
    }

    console.log(`📝 Found ${entries.length} changelog entry/entries`);

    const message = formatChangelogMessage(entries, date);
    console.log("\n📤 Posting to Discord...\n" + "─".repeat(50) + "\n");
    console.log(message);
    console.log(
      "\n" +
        "─".repeat(50) +
        `\nMessage length: ${message.length} characters\n`,
    );

    await postToDiscord(message);
    console.log("\n✅ Successfully posted changelog to Discord!");
    console.log("✅ Release workflow completed!");
  } catch (error) {
    console.error("\n❌ Error in release workflow:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
