import { HomeGridSkeleton } from "./home-grid-skeleton";

/**
 * Shown during route transitions for (public) segment.
 * Layout (header) is already visible; this fills the main content area.
 */
export default function PublicLoading() {
  return (
    <main className="flex min-h-screen flex-col">
      <section className="flex-1 px-4 py-6 sm:px-6">
        <HomeGridSkeleton />
      </section>
    </main>
  );
}
