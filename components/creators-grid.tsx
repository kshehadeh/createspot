"use client";

import { useState } from "react";
import Link from "next/link";
import { User } from "lucide-react";
import { getUserImageUrl } from "@/lib/user-image";
import { Card } from "@/components/ui/card";

interface Creator {
  id: string;
  name: string | null;
  profileImageUrl: string | null;
  image: string | null;
  _count: {
    submissions: number;
  };
}

interface CreatorsGridProps {
  creators: Creator[];
}

function CreatorCard({ creator }: { creator: Creator }) {
  const [imageError, setImageError] = useState(false);
  const displayImage = getUserImageUrl(creator.profileImageUrl, creator.image);
  const submissionCount = creator._count.submissions;
  const shouldShowImage = displayImage && !imageError;

  return (
    <Link
      href={`/creators/${creator.id}`}
      className="group block transition-transform hover:-translate-y-1"
    >
      <Card className="overflow-hidden rounded-none border-0 border-border/60 bg-card/70 shadow-sm transition-all hover:border-border hover:bg-card hover:shadow-lg">
        <div className="relative aspect-square w-full overflow-hidden">
          {shouldShowImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayImage}
              alt={creator.name || "Creator"}
              className="h-full w-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <User className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="border-t border-border/60 bg-card p-4">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-medium text-foreground">
              {creator.name || "Anonymous"}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {submissionCount} {submissionCount === 1 ? "work" : "works"}
            </p>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export function CreatorsGrid({ creators }: CreatorsGridProps) {
  if (creators.length === 0) {
    return (
      <div className="border border-dashed border-border py-16 text-center">
        <p className="text-muted-foreground">No creators found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {creators.map((creator) => (
        <CreatorCard key={creator.id} creator={creator} />
      ))}
    </div>
  );
}
