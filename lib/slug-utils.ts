import { prisma } from "./prisma";
import { generateSlug } from "./utils";

/**
 * Ensures a slug is unique by appending a number if needed
 * @param baseSlug - The base slug to check
 * @param excludeUserId - Optional user ID to exclude from uniqueness check (for updates)
 * @returns A unique slug
 */
export async function ensureUniqueSlug(
  baseSlug: string,
  excludeUserId?: string,
): Promise<string> {
  if (!baseSlug) return baseSlug;

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existingUser = await prisma.user.findUnique({
      where: { slug },
      select: { id: true },
    });

    // If no user exists with this slug, or it's the excluded user, it's available
    if (!existingUser || existingUser.id === excludeUserId) {
      return slug;
    }

    // Slug is taken, try with a number suffix
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

/**
 * Generates a unique slug from a name
 * @param name - The name to convert to a slug
 * @param excludeUserId - Optional user ID to exclude from uniqueness check
 * @returns A unique slug
 */
export async function generateUniqueSlug(
  name: string,
  excludeUserId?: string,
): Promise<string> {
  const baseSlug = generateSlug(name);
  if (!baseSlug) return "";
  return ensureUniqueSlug(baseSlug, excludeUserId);
}
