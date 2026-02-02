#!/usr/bin/env bun

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "data");
const WORDS_FILE = join(DATA_DIR, "words.json");

const MOBY_URL = "https://www.gutenberg.org/files/3201/files/single.txt";

async function downloadWords(): Promise<void> {
  console.log("Downloading Moby word list...");

  try {
    const response = await fetch(MOBY_URL);
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.status}`);
    }

    const text = await response.text();
    const lines = text
      .split("\n")
      .map((line) => line.trim().toLowerCase())
      .filter(Boolean);

    // Filter to reasonable words (2-15 chars, only letters)
    const words = lines.filter(
      (word) => word.length >= 2 && word.length <= 15 && /^[a-z]+$/.test(word),
    );

    // Remove duplicates
    const uniqueWords = [...new Set(words)];

    console.log(`Processed ${uniqueWords.length} words`);

    // Ensure data directory exists
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }

    // Write as JSON
    writeFileSync(WORDS_FILE, JSON.stringify(uniqueWords));

    console.log(`Word list saved to ${WORDS_FILE}`);
  } catch (error) {
    console.error(
      "Error downloading word list:",
      error instanceof Error ? error.message : error,
    );

    // If file doesn't exist, create an empty one so the app doesn't break
    if (!existsSync(WORDS_FILE)) {
      if (!existsSync(DATA_DIR)) {
        mkdirSync(DATA_DIR, { recursive: true });
      }
      writeFileSync(WORDS_FILE, JSON.stringify([]));
      console.log("Created empty word list as fallback");
    }
  }
}

downloadWords();
