"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "@/components/link";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import {
  BaseModal,
  BaseModalContent,
  BaseModalHeader,
  BaseModalTitle,
  BaseModalScrollArea,
} from "@/components/ui/base-modal";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@createspot/ui-primitives/avatar";
import { CommentList } from "@/components/comment-list";
import { CommentInput } from "@/components/comment-input";
import { cn, getCreatorUrl } from "@/lib/utils";

interface CommentViewerSubmission {
  id: string;
  title: string | null;
  imageUrl: string | null;
  user: {
    id: string;
    name: string | null;
    image: string | null;
    profileImageUrl: string | null;
    slug: string | null;
  };
  _count: {
    comments: number;
  };
}

interface CommentViewerModalProps {
  submission: CommentViewerSubmission;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called when the comment count changes so the parent can update its state. */
  onCommentCountChange?: (submissionId: string, newCount: number) => void;
}

export function CommentViewerModal({
  submission,
  open,
  onOpenChange,
  onCommentCountChange,
}: CommentViewerModalProps) {
  const t = useTranslations("comments");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyingToName, setReplyingToName] = useState<string | null>(null);
  const [commentCount, setCommentCount] = useState(submission._count.comments);
  const [refreshKey, setRefreshKey] = useState(0);
  const { data: session } = useSession();

  useEffect(() => {
    if (open) {
      setCommentCount(submission._count.comments);
    }
  }, [open, submission._count.comments, submission.id]);

  // Notify parent when comment count changes
  useEffect(() => {
    if (commentCount !== submission._count.comments) {
      onCommentCountChange?.(submission.id, commentCount);
    }
  }, [commentCount, submission.id, submission._count.comments, onCommentCountChange]);

  const creatorUrl = getCreatorUrl(submission.user);
  const userInitials = submission.user.name
    ? submission.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const handleReply = useCallback(
    (commentId: string, userName: string | null) => {
      setReplyingToId(commentId);
      setReplyingToName(userName);
    },
    [],
  );

  const handleCancelReply = useCallback(() => {
    setReplyingToId(null);
    setReplyingToName(null);
  }, []);

  const handleCommentAdded = useCallback(() => {
    setCommentCount((prev) => prev + 1);
    setRefreshKey((prev) => prev + 1);
    handleCancelReply();
  }, [handleCancelReply]);

  const handleRefreshNeeded = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const handleClose = useCallback(() => {
    onOpenChange(false);
    // Reset reply state on close
    handleCancelReply();
  }, [onOpenChange, handleCancelReply]);

  return (
    <BaseModal open={open} onOpenChange={handleClose}>
      <BaseModalContent className="flex h-full max-h-full flex-col p-0 sm:h-[85vh] sm:max-w-lg sm:rounded-lg md:h-[85vh]">
        <BaseModalHeader className="border-b border-border px-4 py-3">
          <BaseModalTitle className="text-base">
            {t("title")}
            {commentCount > 0 && (
              <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                ({commentCount})
              </span>
            )}
          </BaseModalTitle>
        </BaseModalHeader>

        {/* Submission preview */}
        <Link
          href={`${creatorUrl}/s/${submission.id}`}
          className="flex items-center gap-3 border-b border-border px-4 py-3 hover:bg-muted/50 transition-colors"
          onClick={() => handleClose()}
        >
          {submission.imageUrl && (
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-surface-lowest">
              <Image
                src={submission.imageUrl}
                alt={submission.title || ""}
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {submission.title || t("untitled")}
            </p>
            <div className="flex items-center gap-2">
              <Avatar className="h-4 w-4">
                <AvatarImage
                  src={
                    submission.user.profileImageUrl ||
                    submission.user.image ||
                    undefined
                  }
                  alt={submission.user.name || ""}
                />
                <AvatarFallback className="text-[8px]">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground truncate">
                {submission.user.name || t("anonymous")}
              </span>
            </div>
          </div>
        </Link>

        {/* Comment list */}
        <BaseModalScrollArea className="flex-1 overflow-y-auto px-4 py-2">
          <CommentList
            submissionId={submission.id}
            submissionOwnerId={submission.user.id}
            replyingToId={replyingToId}
            refreshKey={refreshKey}
            onRefreshNeeded={handleRefreshNeeded}
            onReply={handleReply}
            onCommentsChange={() => {
              setCommentCount((prev) => Math.max(0, prev - 1));
            }}
          />
        </BaseModalScrollArea>

        {/* Comment input */}
        {session?.user && (
          <CommentInput
            submissionId={submission.id}
            replyingToId={replyingToId}
            replyingToName={replyingToName}
            onCancelReply={handleCancelReply}
            onCommentAdded={handleCommentAdded}
          />
        )}
      </BaseModalContent>
    </BaseModal>
  );
}
