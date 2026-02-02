#!/usr/bin/env bun

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

function printUsage(): void {
  console.log(
    [
      "Usage:",
      "  bun scripts/post-changelog-to-discord.ts [date]",
      "",
      "Arguments:",
      "  [date]        Optional date in YYYY-MM-DD format. If not provided, uses most recent changelog file.",
      "",
      "Options:",
      "  --help, -h    Show this help message",
      "  --dry-run     Preview the message without posting to Discord",
      "",
      "Environment Variables:",
      "  DISCORD_WEBHOOK_URL  Discord webhook URL for announcements channel (required unless --dry-run)",
      "",
      "Examples:",
      "  bun scripts/post-changelog-to-discord.ts",
      "  bun scripts/post-changelog-to-discord.ts 2026-01-25",
      "  bun scripts/post-changelog-to-discord.ts --dry-run",
      "",
      "Notes:",
      "  - Requires a Discord webhook URL (unless using --dry-run)",
      "  - To create a webhook: Discord Server Settings > Integrations > Webhooks > New Webhook",
      "  - Posts formatted changelog entries to the webhook's channel",
    ].join("\n"),
  );
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

async function readChangelogForDate(date: string): Promise<string | null> {
  const changelogsDir = getChangelogsDir();
  const filePath = join(changelogsDir, `${date}.json`);

  try {
    await readFile(filePath, "utf-8");
    return filePath;
  } catch (error) {
    console.error(`Error reading changelog file for date ${date}: ${error}`);
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
  // If it's already in YYYY-MM-DD format, parse it directly
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
  // Otherwise, try to parse as ISO date string
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

    // Group by area within each type
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

  // Validate webhook URL format
  if (!webhookUrl.startsWith("https://discord.com/api/webhooks/")) {
    throw new Error(
      "Invalid webhook URL format. Expected: https://discord.com/api/webhooks/{id}/{token}",
    );
  }

  // Discord has a 2000 character limit per message
  // If message is too long, we'll need to split it
  const maxLength = 2000;
  const messages = [];

  if (message.length <= maxLength) {
    messages.push(message);
  } else {
    // Split by sections
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

    // Add continuation markers if needed
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

    // Consume response body to ensure connection is properly closed
    await response.text();
    console.log(`✅ Posted message ${i + 1}/${messages.length} to Discord`);

    // Add a small delay between messages to avoid rate limits
    if (!isLast) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    printUsage();
    process.exit(0);
  }

  const isDryRun = args.includes("--dry-run");

  let changelogPath: string | null = null;
  let date: string | null = null;

  // Parse date argument
  const dateArg = args.find((arg) => /^\d{4}-\d{2}-\d{2}$/.test(arg));
  if (dateArg) {
    date = dateArg;
    changelogPath = await readChangelogForDate(date);
    if (!changelogPath) {
      console.error(`❌ No changelog file found for date: ${date}`);
      process.exit(1);
    }
  } else {
    changelogPath = await findMostRecentChangelog();
    if (!changelogPath) {
      console.error("❌ No changelog files found in changelogs directory");
      process.exit(1);
    }
    // Extract date from filename
    const filename = changelogPath.split("/").pop()?.replace(".json", "");
    date = filename || "unknown";
    console.log(`📅 Using most recent changelog: ${date}`);
  }

  console.log(`📖 Reading changelog from: ${changelogPath}`);

  const entries = await loadChangelogEntries(changelogPath);
  if (entries.length === 0) {
    console.error("❌ No changelog entries found in file");
    process.exit(1);
  }

  console.log(`📝 Found ${entries.length} changelog entry/entries`);

  const message = formatChangelogMessage(entries, date);
  console.log(
    "\n" +
      (isDryRun
        ? "🔍 DRY RUN - Message preview:"
        : "📤 Posting to Discord...") +
      "\n",
  );
  console.log("Message preview:");
  console.log("─".repeat(50));
  console.log(message);
  console.log("─".repeat(50));
  console.log(`\nMessage length: ${message.length} characters`);

  if (isDryRun) {
    console.log(
      "\n✅ Dry run complete. Use without --dry-run to post to Discord.",
    );
    return;
  }

  console.log("");

  try {
    await postToDiscord(message);
    console.log("\n✅ Successfully posted changelog to Discord!");
  } catch (error) {
    console.error("\n❌ Error posting to Discord:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
