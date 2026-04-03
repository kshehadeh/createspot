/**
 * Shown during route transitions for (public) segment.
 */
export default function PublicLoading() {
  return (
    <main className="mx-auto w-full max-w-[600px] flex-1 py-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border-b border-border animate-pulse">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="h-9 w-9 rounded-full bg-muted" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-32 rounded bg-muted" />
              <div className="h-3 w-20 rounded bg-muted" />
            </div>
          </div>
          <div className="aspect-square w-full bg-muted" />
          <div className="flex gap-3 px-4 py-2">
            <div className="h-7 w-7 rounded-full bg-muted" />
            <div className="h-7 w-7 rounded-full bg-muted" />
          </div>
          <div className="px-4 pb-4 space-y-1.5">
            <div className="h-3 w-24 rounded bg-muted" />
            <div className="h-3 w-48 rounded bg-muted" />
          </div>
        </div>
      ))}
    </main>
  );
}
