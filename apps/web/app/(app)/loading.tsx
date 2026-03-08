/**
 * Shown during route transitions for (app) segment.
 * Layout (header) is already visible; this fills the main content area.
 */
export default function AppLoading() {
  return (
    <div className="flex min-h-[50vh] flex-1 items-center justify-center">
      <div className="h-8 w-32 animate-pulse rounded-md bg-muted" aria-hidden />
    </div>
  );
}
