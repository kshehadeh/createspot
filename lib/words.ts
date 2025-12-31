import { readFileSync, existsSync } from "fs";
import { join } from "path";

let wordsCache: Set<string> | null = null;
let wordsArray: string[] | null = null;

function loadWords(): { set: Set<string>; array: string[] } {
  if (wordsCache && wordsArray) {
    return { set: wordsCache, array: wordsArray };
  }

  const wordsPath = join(process.cwd(), "data", "words.json");

  if (!existsSync(wordsPath)) {
    console.warn("Words file not found. Run: npm run download-words");
    wordsCache = new Set();
    wordsArray = [];
    return { set: wordsCache, array: wordsArray };
  }

  try {
    const data = readFileSync(wordsPath, "utf-8");
    wordsArray = JSON.parse(data) as string[];
    wordsCache = new Set(wordsArray);
    return { set: wordsCache, array: wordsArray };
  } catch (error) {
    console.error("Error loading words:", error);
    wordsCache = new Set();
    wordsArray = [];
    return { set: wordsCache, array: wordsArray };
  }
}

export function isValidWord(word: string): boolean {
  const { set } = loadWords();
  return set.has(word.toLowerCase().trim());
}

export function getRandomWord(): string | null {
  const { array } = loadWords();
  if (array.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}

export function getWordCount(): number {
  const { array } = loadWords();
  return array.length;
}
