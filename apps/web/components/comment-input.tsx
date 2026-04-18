"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Button } from "@createspot/ui-primitives/button";
import { Loader2, Send, X } from "lucide-react";

interface CommentInputProps {
  submissionId: string;
  replyingToId: string | null;
  replyingToName: string | null;
  onCancelReply: () => void;
  onCommentAdded?: () => void;
}

export function CommentInput({
  submissionId,
  replyingToId,
  replyingToName,
  onCancelReply,
  onCommentAdded,
}: CommentInputProps) {
  const t = useTranslations("comments");
  const { data: session } = useSession();
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!body.trim() || isSubmitting) return;

      setIsSubmitting(true);
      try {
        const response = await fetch(
          `/api/submissions/${submissionId}/comments`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              body: body.trim(),
              parentId: replyingToId || undefined,
            }),
          },
        );

        if (response.ok) {
          setBody("");
          onCommentAdded?.();
        }
      } catch {
        // Silently fail
      } finally {
        setIsSubmitting(false);
      }
    },
    [body, isSubmitting, submissionId, replyingToId, onCommentAdded],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    },
    [handleSubmit],
  );

  if (!session?.user) return null;

  return (
    <div className="border-t border-border bg-surface-container px-4 py-3">
      {/* Reply-to indicator */}
      {replyingToId && replyingToName && (
        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{t("replyingTo", { name: replyingToName })}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0"
            onClick={onCancelReply}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={replyingToId ? t("replyPlaceholder") : t("placeholder")}
          className="flex-1 rounded-full border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          disabled={isSubmitting}
          maxLength={2000}
        />
        <Button
          type="submit"
          size="icon"
          className="h-9 w-9 shrink-0 rounded-full"
          disabled={!body.trim() || isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
