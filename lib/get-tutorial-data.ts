import { prisma } from "@/lib/prisma";

/**
 * Fetches tutorial data for a user by their ID.
 * Returns null if the user is not logged in or doesn't exist.
 *
 * @param userId - User ID from session, or null/undefined if not logged in
 * @returns Tutorial data object, or null if user is not logged in or doesn't exist
 */
export async function getTutorialData(
  userId: string | null | undefined,
): Promise<any | null> {
  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tutorial: true },
  });

  return user?.tutorial || null;
}
