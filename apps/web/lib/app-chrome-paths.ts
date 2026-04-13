/** Submission routes where the main app sidebar should hide for an immersive view. */
export function isFullWidthSubmissionPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    /\/s\/[^/]+\/critiques\/?$/.test(pathname) ||
    /\/s\/[^/]+\/edit\/image\/?$/.test(pathname)
  );
}
