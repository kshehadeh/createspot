import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

const SALT_LENGTH = 16;
const KEY_LENGTH = 64;

/**
 * Hash a plain-text password for storage. Uses scrypt with a random salt.
 * Non-production credentials login only.
 */
export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH).toString("hex");
  const derived = (await scryptAsync(plain, salt, KEY_LENGTH)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

/**
 * Verify a plain-text password against a stored hash. Timing-safe.
 * Non-production credentials login only.
 */
export async function verifyPassword(
  plain: string,
  stored: string,
): Promise<boolean> {
  const [saltHex, keyHex] = stored.split(":");
  if (!saltHex || !keyHex) return false;
  const expected = Buffer.from(keyHex, "hex");
  if (saltHex.length !== SALT_LENGTH * 2 || expected.length !== KEY_LENGTH)
    return false;
  // Keep salt input format consistent with hashPassword() (hex string).
  const derived = (await scryptAsync(plain, saltHex, KEY_LENGTH)) as Buffer;
  return timingSafeEqual(derived, expected);
}
