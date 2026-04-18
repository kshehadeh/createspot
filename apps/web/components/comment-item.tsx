"use client";

import { useState } from "react";
import Link from "@/components/link";
import { useTranslations } from "next-intl";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@createspot/ui-primitives/avatar";
import { Button } from "@createspot/ui-primitives/button";
import { cn, getCreatorUrl } from "@/lib/utils";
import { ConfirmModal } from "@/components/confirm-modal";
import {
  ChevronDown,
  ChevronRight,
  MessageCircle,
  Pencil,
  Trash2,
} from "lucide-react";
import type { CommentData } from "@/components/comment-list";

interface CommentItemProps {
  comment: CommentData;
  depth?: number;
  isOwnComment: boolean;
  isSubmissionOwner: boolean;
  isAdmin: boolean;
  replyingToId: string | null;
  onReply: (commentId: string, userName: string | null) => void;
  onEdit: (commentId: string, body: string) => void;
  onDelete: (commentId: string) => Promise<void>;
  children?: React.ReactNode;
}

function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  if (diffWeeks < 52) return `${diffWeeks}w`;
  return d.toLocaleDateString();
}

const MAX_DEPTH = 4;

export function CommentItem({
  comment,
  depth = 0,
  isOwnComment,
  isSubmissionOwner,
  isAdmin,
  replyingToId,
  onReply,
  onEdit,
  onDelete,
  children,
}: CommentItemProps) {
  const t = useTranslations("comments");
  const [collapsed, setCollapsed] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(comment.body);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (comment.deletedAt) {
    return (
      <div
        className={cn(
          depth > 0 && depth <= MAX_DEPTH && "ml-6 border-l border-border pl-4",
        )}
      >
        <div className="flex items-center gap-3 py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-sm italic text-muted-foreground">
            {t("commentDeleted")}
          </p>
        </div>
        {/* Still render children of deleted comments */}
        {children}
      </div>
    );
  }

  const canEdit = isOwnComment && isWithinEditWindow(comment.createdAt);
  const canDelete = isOwnComment || isSubmissionOwner || isAdmin;

  const handleEditSubmit = () => {
    if (editValue.trim()) {
      onEdit(comment.id, editValue.trim());
      setIsEditing(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await onDelete(comment.id);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const userInitials = comment.user.name
    ? comment.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const creatorUrl = getCreatorUrl(comment.user);

  const isReplying = replyingToId === comment.id;

  return (
    <div
      className={cn(
        depth > 0 && depth <= MAX_DEPTH && "ml-6 border-l border-border pl-4",
        depth > MAX_DEPTH && "ml-6 border-l border-border pl-4",
      )}
    >
      <div
        className={cn(
          "flex gap-3 py-3",
          isReplying && "bg-muted/30 -mx-2 px-2 rounded-lg",
        )}
      >
        <Link href={creatorUrl} className="shrink-0">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={
                comment.user.profileImageUrl || comment.user.image || undefined
              }
              alt={comment.user.name || ""}
            />
            <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
          </Avatar>
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link
              href={creatorUrl}
              className="text-sm font-semibold text-foreground hover:underline truncate"
            >
              {comment.user.name || t("anonymous")}
            </Link>
            <time
              dateTime={new Date(comment.createdAt).toISOString()}
              className="shrink-0 text-xs text-muted-foreground"
            >
              {formatRelativeTime(comment.createdAt)}
            </time>
          </div>

          {isEditing ? (
            <div className="mt-1 flex gap-2">
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleEditSubmit();
                  if (e.key === "Escape") setIsEditing(false);
                }}
                className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                autoFocus
              />
              <Button size="sm" onClick={handleEditSubmit}>
                {t("save")}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(false)}
              >
                {t("cancel")}
              </Button>
            </div>
          ) : (
            <p className="mt-0.5 text-sm text-foreground break-words">
              {comment.body}
            </p>
          )}

          {/* Action row */}
          {!isEditing && (
            <div className="mt-1 flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-1 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => onReply(comment.id, comment.user.name)}
              >
                <MessageCircle className="mr-1 h-3 w-3" />
                {t("reply")}
              </Button>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setEditValue(comment.body);
                    setIsEditing(true);
                  }}
                >
                  <Pencil className="mr-1 h-3 w-3" />
                  {t("edit")}
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1 text-xs text-muted-foreground hover:text-destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isDeleting}
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  {t("delete")}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Collapse toggle when has replies */}
        {comment._count.replies > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* Collapsed indicator */}
      {collapsed && comment._count.replies > 0 && (
        <button
          type="button"
          className="mb-2 ml-6 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setCollapsed(false)}
        >
          {t("nReplies", { count: comment._count.replies })}
        </button>
      )}

      {/* Render children when not collapsed */}
      {!collapsed && children}

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title={t("deleteConfirmTitle")}
        message={
          comment._count.replies > 0
            ? t("deleteConfirmMessageWithReplies", {
                count: comment._count.replies,
              })
            : t("deleteConfirmMessage")
        }
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
        isLoading={isDeleting}
      />
    </div>
  );
}

function isWithinEditWindow(createdAt: Date | string): boolean {
  const d = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  const editWindowMs = 15 * 60 * 1000;
  return Date.now() - d.getTime() <= editWindowMs;
}
