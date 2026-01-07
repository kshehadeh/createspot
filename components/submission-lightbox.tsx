"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, X } from "lucide-react";

interface LightboxSubmission {
  id: string;
  title: string | null;
  imageUrl: string | null;
  text: string | null;
  user?: {
    id: string;
    name: string | null;
    image: string | null;
  };
  _count?: {
    favorites: number;
  };
}

interface SubmissionLightboxProps {
  submission: LightboxSubmission;
  word: string;
  onClose: () => void;
  isOpen: boolean;
}

export function SubmissionLightbox({
  submission,
  word,
  onClose,
  isOpen,
}: SubmissionLightboxProps) {
  const [mobileView, setMobileView] = useState<"image" | "text">("image");
  const hasImage = !!submission.imageUrl;
  const hasText = !!submission.text;
  const hasBoth = hasImage && hasText;

  // Get favorite count - handle both _count and direct favoriteCount
  const favoriteCount =
    submission._count?.favorites ?? (submission as any).favoriteCount ?? 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] border-none bg-black/90 p-0">
        <div className="absolute right-4 top-4 z-10 flex gap-2">
          <Button
            asChild
            variant="ghost"
            className="rounded-full bg-white/20 text-white backdrop-blur-sm hover:bg-white/30"
          >
            <Link href={`/s/${submission.id}`} onClick={(e) => e.stopPropagation()}>
              View Full Page
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full bg-black/50 text-white hover:bg-black/70"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Mobile view with tabs */}
        {hasBoth && (
          <div className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 gap-2 md:hidden">
            <Tabs value={mobileView} onValueChange={(v) => setMobileView(v as "image" | "text")}>
              <TabsList className="bg-transparent">
                <TabsTrigger
                  value="image"
                  className="rounded-full data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=inactive]:bg-white/20 data-[state=inactive]:text-white"
                >
                  Image
                </TabsTrigger>
                <TabsTrigger
                  value="text"
                  className="rounded-full data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=inactive]:bg-white/20 data-[state=inactive]:text-white"
                >
                  Text
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}

        <div
          className="flex h-full w-full max-w-7xl flex-col p-4 md:flex-row md:items-center md:gap-6 md:p-8"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Image section */}
        {hasImage && (
          <div
            className={`flex flex-1 items-center justify-center ${
              hasBoth ? "md:w-2/3" : "w-full"
            } ${hasBoth && mobileView === "text" ? "hidden md:flex" : ""}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={submission.imageUrl!}
              alt={submission.title || "Submission"}
              className="max-h-[80vh] max-w-full rounded-lg object-contain"
            />
          </div>
        )}

          {/* Text section */}
          {hasText && (
            <div
              className={`flex flex-col overflow-hidden ${
                hasBoth ? "md:w-1/3" : "w-full max-w-2xl"
              } ${hasBoth && mobileView === "image" ? "hidden md:flex" : ""} ${
                !hasImage ? "mx-auto" : ""
              }`}
            >
              <div className="max-h-[80vh] overflow-y-auto rounded-xl bg-white p-6 dark:bg-zinc-900">
                <div className="mb-4 flex items-center gap-2">
                  <Badge variant="secondary">{word}</Badge>
                  {favoriteCount > 0 && (
                    <div className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                      <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                      <span>{favoriteCount}</span>
                    </div>
                  )}
                </div>
                {submission.title && (
                  <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-white">
                    {submission.title}
                  </h2>
                )}
                <div
                  className="prose prose-zinc dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: submission.text! }}
                />
                {submission.user && (
                  <div className="mt-6 flex items-center gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={submission.user.image || undefined} alt={submission.user.name || "User"} />
                      <AvatarFallback className="bg-zinc-200 dark:bg-zinc-700">
                        {submission.user.name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      {submission.user.name || "Anonymous"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Image-only metadata overlay */}
          {hasImage && !hasText && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 rounded-xl bg-black/70 px-6 py-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <Badge className="bg-white/20 text-white">{word}</Badge>
                {submission.title && (
                  <span className="text-white">{submission.title}</span>
                )}
                {favoriteCount > 0 && (
                  <div className="flex items-center gap-1.5 text-white">
                    <Heart className="h-4 w-4 fill-red-400 text-red-400" />
                    <span className="text-sm">{favoriteCount}</span>
                  </div>
                )}
                {submission.user && (
                  <>
                    <span className="text-zinc-400">by</span>
                    <span className="text-white">
                      {submission.user.name || "Anonymous"}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
