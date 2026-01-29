"use client";

import { useEffect } from "react";

interface ShortUrlRedirectProps {
  to: string;
}

/**
 * Client-side redirect for short URL pages. Replaces the current history entry
 * so the canonical URL is shown and crawlers still receive 200 + meta from the server.
 */
export function ShortUrlRedirect({ to }: ShortUrlRedirectProps) {
  useEffect(() => {
    window.location.replace(to);
  }, [to]);

  return (
    <main className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8">
      <p className="text-muted-foreground text-center">Redirecting…</p>
    </main>
  );
}
