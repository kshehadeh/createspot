#!/usr/bin/env bun
/**
 * Post release notes to Discord (webhook). Used locally and in CI after a GitHub Release.
 * Body: DISCORD_RELEASE_BODY env, or stdin when piped.
 */

import { readFileSync } from "node:fs";

function readStdinSync(): string {
  return readFileSync(0, "utf-8").trim();
}

function printUsage(): void {
  console.log(
    [
      "Usage:",
      "  DISCORD_RELEASE_BODY='...' bun scripts/post-changelog-to-discord.ts",
      "  cat notes.md | bun scripts/post-changelog-to-discord.ts",
      "",
      "Options:",
      "  --help, -h    Show this help message",
      "  --dry-run     Preview the message without posting to Discord",
      "",
      "Environment:",
      "  DISCORD_RELEASE_BODY  Release notes text (markdown/plain)",
      "  DISCORD_WEBHOOK_URL   Discord webhook URL (required unless --dry-run)",
      "  GITHUB_REF_NAME       Optional; prefixed as title (e.g. v2.18.0 from CI)",
    ].join("\n"),
  );
}

function buildMessage(body: string): string {
  const ref = process.env["GITHUB_REF_NAME"]?.trim();
  const title = ref ? `**Create Spot ${ref}**\n\n` : "";
  return `${title}${body.trim()}`;
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
  const messages: string[] = [];

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
        currentMessage = `${section}\n\n`;
      } else {
        currentMessage += `${section}\n\n`;
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

function resolveBody(): string {
  const fromEnv = process.env["DISCORD_RELEASE_BODY"];
  if (fromEnv !== undefined && fromEnv.trim() !== "") {
    return fromEnv.trim();
  }

  if (process.stdin.isTTY !== true) {
    const piped = readStdinSync();
    if (piped) {
      return piped;
    }
  }

  return "";
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    printUsage();
    process.exit(0);
  }

  const isDryRun = args.includes("--dry-run");
  const rawBody = resolveBody();

  if (!rawBody) {
    console.error(
      "❌ No release body: set DISCORD_RELEASE_BODY or pipe content on stdin.",
    );
    process.exit(1);
  }

  const message = buildMessage(rawBody);
  console.log(
    `\n${isDryRun ? "🔍 DRY RUN — preview:" : "📤 Posting to Discord..."}\n`,
  );
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

  try {
    await postToDiscord(message);
    console.log("\n✅ Successfully posted to Discord!");
  } catch (error) {
    console.error("\n❌ Error posting to Discord:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
