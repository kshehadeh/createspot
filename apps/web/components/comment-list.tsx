"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { CommentItem } from "@/components/comment-item";
import { Loader2 } from "lucide-react";

export interface CommentData {
  id: string;
  body: string;
  parentId: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
    profileImageUrl: string | null;
    slug: string | null;
  };
  _count: {
    replies: number;
  };
}

interface CommentListNode {
  comment: CommentData;
  children: CommentListNode[];
}

function buildCommentTree(comments: CommentData[]): CommentListNode[] {
  const map = new Map<string, CommentListNode>();
  const roots: CommentListNode[] = [];

  for (const comment of comments) {
    map.set(comment.id, { comment, children: [] });
  }

  for (const comment of comments) {
    const node = map.get(comment.id)!;
    if (comment.parentId && map.has(comment.parentId)) {
      map.get(comment.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

interface CommentListProps {
  submissionId: string;
  submissionOwnerId: string;
  replyingToId: string | null;
  /** Increment this to trigger a refetch (e.g. when a new comment is posted). */
  refreshKey: number;
  /** Called when refreshKey should be bumped (e.g. after delete). */
  onRefreshNeeded: () => void;
  onReply: (commentId: string, userName: string | null) => void;
  onCommentsChange?: () => void;
}

export function CommentList({
  submissionId,
  submissionOwnerId,
  replyingToId,
  refreshKey,
  onRefreshNeeded,
  onReply,
  onCommentsChange,
}: CommentListProps) {
  const t = useTranslations("comments");
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const isAdmin = session?.user?.isAdmin ?? false;

  const [comments, setComments] = useState<CommentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ take: "20" });
      const response = await fetch(
        `/api/submissions/${submissionId}/comments?${params.toString()}`,
      );
      if (!response.ok) throw new Error("Failed to fetch comments");
      const data = await response.json();
      setComments(data.comments || []);
      setHasMore(data.hasMore ?? false);
      setNextCursor(data.nextCursor ?? null);
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  }, [submissionId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments, refreshKey]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || !nextCursor) return;
    setIsLoadingMore(true);
    try {
      const params = new URLSearchParams({ cursor: nextCursor, take: "20" });
      const response = await fetch(
        `/api/submissions/${submissionId}/comments?${params.toString()}`,
      );
      if (!response.ok) throw new Error("Failed to load more comments");
      const data = await response.json();
      setComments((prev) => [...prev, ...(data.comments || [])]);
      setHasMore(data.hasMore ?? false);
      setNextCursor(data.nextCursor ?? null);
    } catch {
      // Silently fail
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, nextCursor, submissionId]);

  useEffect(() => {
    if (!hasMore) return;
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          loadMore();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadMore]);

  const handleEdit = useCallback(async (commentId: string, body: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (response.ok) {
        const data = await response.json();
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId
              ? {
                  ...c,
                  body: data.comment.body,
                  updatedAt: data.comment.updatedAt,
                }
              : c,
          ),
        );
      }
    } catch {
      // Silently fail
    }
  }, []);

  const handleDelete = useCallback(
    async (commentId: string) => {
      try {
        const response = await fetch(`/api/comments/${commentId}`, {
          method: "DELETE",
        });
        if (response.ok) {
          onCommentsChange?.();
          onRefreshNeeded();
        }
      } catch {
        // Silently fail
      }
    },
    [onCommentsChange, onRefreshNeeded],
  );

  const tree = buildCommentTree(comments);

  const renderNode = (node: CommentListNode, depth: number = 0) => {
    const isOwnComment = currentUserId === node.comment.user.id;
    const isSubOwner = currentUserId === submissionOwnerId;

    return (
      <CommentItem
        key={node.comment.id}
        comment={node.comment}
        depth={depth}
        isOwnComment={isOwnComment}
        isSubmissionOwner={isSubOwner}
        isAdmin={isAdmin}
        replyingToId={replyingToId}
        onReply={onReply}
        onEdit={handleEdit}
        onDelete={handleDelete}
      >
        {node.children.map((child) => renderNode(child, depth + 1))}
      </CommentItem>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (tree.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-muted-foreground">{t("noComments")}</p>
      </div>
    );
  }

  return (
    <div>
      {tree.map((node) => renderNode(node))}
      {isLoadingMore && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
      {hasMore && <div ref={sentinelRef} className="h-4" />}
    </div>
  );
}
