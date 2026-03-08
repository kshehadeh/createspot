/**
 * Skeleton shown while HomeContent (cached exhibition data) streams in.
 * Matches the grid layout so layout shift is minimal when content replaces it.
 */
export function HomeGridSkeleton() {
  const placeholders = 8;
  return (
    <div
      className="grid w-full min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      aria-hidden
    >
      {Array.from({ length: placeholders }, (_, i) => (
        <div
          key={i}
          className="aspect-square overflow-hidden rounded-none bg-muted/60 animate-pulse"
        />
      ))}
    </div>
  );
}
