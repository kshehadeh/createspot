/**
 * Builds List-Unsubscribe header for notification emails.
 * Gmail, Yahoo, and Microsoft recommend this for bulk/notification mail to reduce spam filtering.
 *
 * @param preferencesUrl - Full URL where the user can manage notification preferences (e.g. profile edit).
 * @returns Headers to pass to sendEmail options. Use List-Unsubscribe-Post only when you have a POST endpoint that processes one-click unsubscribe.
 */
export function listUnsubscribeHeaders(
  preferencesUrl: string,
): Record<string, string> {
  return {
    "List-Unsubscribe": `<${preferencesUrl}>`,
  };
}
