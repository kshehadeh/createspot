/**
 * Gets the preferred user image URL.
 * Priority: profileImageUrl > oauthImage > null
 */
export function getUserImageUrl(
  profileImageUrl: string | null | undefined,
  oauthImage: string | null | undefined,
): string | null {
  return profileImageUrl || oauthImage || null;
}
