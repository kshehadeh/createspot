import fs from "fs";
import path from "path";

const TIMESTAMP_FILE = path.join(__dirname, "..", ".auth", "run-timestamp.txt");

export function writeRunTimestamp(date: Date) {
  fs.mkdirSync(path.dirname(TIMESTAMP_FILE), { recursive: true });
  fs.writeFileSync(TIMESTAMP_FILE, date.toISOString());
}

export function readRunTimestamp(): Date | null {
  try {
    const content = fs.readFileSync(TIMESTAMP_FILE, "utf-8");
    return new Date(content.trim());
  } catch {
    return null;
  }
}

export function clearRunTimestamp() {
  try {
    fs.unlinkSync(TIMESTAMP_FILE);
  } catch {
    // Ignore if file doesn't exist
  }
}
