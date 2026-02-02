"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ConfirmModal } from "@/components/confirm-modal";
import {
  ChevronDown,
  ChevronRight,
  Eye,
  MessageCircle,
  NotebookPen,
} from "lucide-react";
import { toast } from "sonner";
import { getCreatorUrl } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const RichTextEditor = dynamic(
  () =>
    import("@/components/rich-text-editor").then((mod) => mod.RichTextEditor),
  {
    ssr: false,
    loading: () => (
      <div className="h-32 rounded-md border border-input bg-muted/50 animate-pulse" />
    ),
  },
);

export interface Critique {
  id: string;
  critique: string;
  response: string | null;
  seenAt: string | null;
  createdAt: string;
  updatedAt: string;
  critiquer: {
    id: string;
    slug: string | null;
    name: string | null;
    image: string | null;
  };
}

export interface CritiquesPanelProps {
  submissionId: string;
  isOwner: boolean;
  currentUserId?: string | null;
  submissionTitle?: string | null;
  onUnseenCountChange?: (count: number) => void;
}

export function CritiquesPanel({
  submissionId,
  isOwner,
  submissionTitle: _submissionTitle,
  onUnseenCountChange,
}: CritiquesPanelProps) {
  const t = useTranslations("critique");
  const tCommon = useTranslations("common");
  const [critiques, setCritiques] = useState<Critique[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [editingResponseId, setEditingResponseId] = useState<string | null>(
    null,
  );
  const [newCritique, setNewCritique] = useState("");
  const [editCritique, setEditCritique] = useState("");
  const [replyText, setReplyText] = useState("");
  const [editResponseText, setEditResponseText] = useState("");
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null,
  );
  const [showDeleteCreatorConfirm, setShowDeleteCreatorConfirm] = useState<
    string | null
  >(null);
  const [showDeleteResponseConfirm, setShowDeleteResponseConfirm] = useState<
    string | null
  >(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [hasMarkedAsSeen, setHasMarkedAsSeen] = useState(false);
  const [openGroupIds, setOpenGroupIds] = useState<Set<string>>(new Set());
  const hasInitializedFirstOpen = useRef(false);

  const groupsByCritiquer = useMemo(() => {
    if (!isOwner || critiques.length === 0) return [];
    const map = new Map<
      string,
      { critiquer: Critique["critiquer"]; critiques: Critique[] }
    >();
    for (const c of critiques) {
      const id = c.critiquer.id;
      if (!map.has(id)) {
        map.set(id, { critiquer: c.critiquer, critiques: [] });
      }
      map.get(id)!.critiques.push(c);
    }
    return Array.from(map.values());
  }, [isOwner, critiques]);

  /** Unified list of groups for both owner (by critiquer) and viewer ("Your Critiques"). Same collapsible UI for both. */
  const displayGroups = useMemo((): Array<{
    id: string;
    header: React.ReactNode;
    critiques: Critique[];
  }> => {
    if (critiques.length === 0) return [];
    if (isOwner) {
      return groupsByCritiquer.map((group) => ({
        id: group.critiquer.id,
        header: (
          <Link
            href={getCreatorUrl(group.critiquer)}
            className="text-lg font-semibold text-foreground hover:underline"
          >
            {group.critiquer.name || t("critiquer")}
          </Link>
        ),
        critiques: group.critiques,
      }));
    }
    return [
      {
        id: "yours",
        header: (
          <span className="text-lg font-semibold text-foreground">
            {t("yourCritiques")}
          </span>
        ),
        critiques,
      },
    ];
  }, [isOwner, critiques, groupsByCritiquer, t]);

  /** Expand the first group when groups first load (creator and viewer). */
  useEffect(() => {
    if (displayGroups.length > 0) {
      if (!hasInitializedFirstOpen.current) {
        hasInitializedFirstOpen.current = true;
        const firstId = displayGroups[0].id;
        setOpenGroupIds((prev) => new Set([...prev, firstId]));
      }
    } else {
      hasInitializedFirstOpen.current = false;
    }
  }, [displayGroups.length, displayGroups[0]?.id]);

  useEffect(() => {
    setHasMarkedAsSeen(false);
    hasInitializedFirstOpen.current = false;
    fetchCritiques();
  }, [submissionId, isOwner]);

  useEffect(() => {
    if (isOwner && critiques.length > 0 && !hasMarkedAsSeen) {
      markAllAsSeen();
      setHasMarkedAsSeen(true);
    }
  }, [isOwner, critiques.length, hasMarkedAsSeen]);

  const fetchCritiques = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/submissions/${submissionId}/critiques`,
      );
      if (response.ok) {
        const data = await response.json();
        setCritiques(data.critiques);
        if (isOwner && onUnseenCountChange) {
          const unseen = data.critiques.filter(
            (c: Critique) => c.seenAt === null,
          ).length;
          onUnseenCountChange(unseen);
        }
      }
    } catch (error) {
      console.error("Failed to fetch critiques:", error);
      toast.error(tCommon("error"));
    } finally {
      setLoading(false);
    }
  };

  const markAllAsSeen = async () => {
    const unseenCritiques = critiques.filter((c) => c.seenAt === null);
    for (const critique of unseenCritiques) {
      try {
        await fetch(`/api/critiques/${critique.id}/seen`, {
          method: "POST",
        });
      } catch (error) {
        console.error("Failed to mark critique as seen:", error);
      }
    }
    const response = await fetch(`/api/submissions/${submissionId}/critiques`);
    if (response.ok) {
      const data = await response.json();
      setCritiques(data.critiques);
      if (onUnseenCountChange) {
        const unseen = data.critiques.filter(
          (c: Critique) => c.seenAt === null,
        ).length;
        onUnseenCountChange(unseen);
      }
    }
  };

  const handleAddCritique = async () => {
    if (!newCritique.trim()) {
      toast.error(t("critiquePlaceholder"));
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(
        `/api/submissions/${submissionId}/critiques`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ critique: newCritique }),
        },
      );
      if (response.ok) {
        toast.success(tCommon("success"));
        setNewCritique("");
        setShowAddForm(false);
        await fetchCritiques();
      } else {
        const data = await response.json();
        toast.error(data.error || tCommon("error"));
      }
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setSaving(false);
    }
  };

  const handleEditCritique = async (id: string) => {
    if (!editCritique.trim()) {
      toast.error(t("critiquePlaceholder"));
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`/api/critiques/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ critique: editCritique }),
      });
      if (response.ok) {
        toast.success(tCommon("success"));
        setEditingId(null);
        setEditCritique("");
        await fetchCritiques();
      } else {
        const data = await response.json();
        toast.error(data.error || tCommon("error"));
      }
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCritique = async (id: string) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/critiques/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success(tCommon("success"));
        setShowDeleteConfirm(null);
        setShowDeleteCreatorConfirm(null);
        await fetchCritiques();
      } else {
        const data = await response.json();
        toast.error(data.error || tCommon("error"));
      }
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setSaving(false);
    }
  };

  const handleReply = async (id: string) => {
    if (!replyText.trim()) {
      toast.error(t("responsePlaceholder"));
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`/api/critiques/${id}/response`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: replyText }),
      });
      if (response.ok) {
        toast.success(tCommon("success"));
        setReplyingId(null);
        setReplyText("");
        await fetchCritiques();
      } else {
        const data = await response.json();
        toast.error(data.error || tCommon("error"));
      }
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setSaving(false);
    }
  };

  const handleEditResponse = async (id: string) => {
    if (!editResponseText.trim()) {
      toast.error(t("responsePlaceholder"));
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`/api/critiques/${id}/response`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: editResponseText }),
      });
      if (response.ok) {
        toast.success(tCommon("success"));
        setEditingResponseId(null);
        setEditResponseText("");
        await fetchCritiques();
      } else {
        const data = await response.json();
        toast.error(data.error || tCommon("error"));
      }
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteResponse = async (id: string) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/critiques/${id}/response`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success(tCommon("success"));
        setShowDeleteResponseConfirm(null);
        await fetchCritiques();
      } else {
        const data = await response.json();
        toast.error(data.error || tCommon("error"));
      }
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (critique: Critique) => {
    setEditingId(critique.id);
    setEditCritique(critique.critique);
  };

  const startAddCritique = () => {
    setShowAddForm(true);
    setNewCritique("");
  };

  const startEditResponse = (critique: Critique) => {
    setEditingResponseId(critique.id);
    setEditResponseText(critique.response || "");
  };

  const canEdit = (critique: Critique) => !isOwner && critique.seenAt === null;
  const canDelete = (critique: Critique) =>
    !isOwner && critique.seenAt === null;

  function formatCritiqueDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function renderCritiqueBody(critique: Critique) {
    return (
      <>
        {editingId === critique.id ? (
          <div className="space-y-3">
            <RichTextEditor
              value={editCritique}
              onChange={setEditCritique}
              placeholder={t("critiquePlaceholder")}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleEditCritique(critique.id)}
                disabled={saving}
              >
                {saving ? t("saving") : tCommon("save")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingId(null);
                  setEditCritique("");
                }}
              >
                {tCommon("cancel")}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div
              className="prose prose-sm dark:prose-invert max-w-none mb-1 font-mono text-sm"
              dangerouslySetInnerHTML={{ __html: critique.critique }}
            />
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <time dateTime={critique.createdAt}>
                {formatCritiqueDate(critique.createdAt)}
              </time>
              {critique.seenAt != null && (
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        className="inline-flex shrink-0 text-muted-foreground focus:outline-none"
                        role="img"
                        aria-label={t("seenOn", {
                          date: formatCritiqueDate(critique.seenAt),
                        })}
                      >
                        <Eye size={12} strokeWidth={1.5} className="block" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      {t("seenOn", {
                        date: formatCritiqueDate(critique.seenAt),
                      })}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {!isOwner && (
                <>
                  {(canEdit(critique) || canDelete(critique)) && (
                    <span aria-hidden> · </span>
                  )}
                  {canEdit(critique) && (
                    <button
                      type="button"
                      className="hover:text-foreground hover:underline"
                      onClick={() => startEdit(critique)}
                    >
                      {tCommon("edit")}
                    </button>
                  )}
                  {canEdit(critique) && canDelete(critique) && (
                    <span aria-hidden> · </span>
                  )}
                  {canDelete(critique) && (
                    <button
                      type="button"
                      className="text-destructive hover:text-destructive hover:underline"
                      onClick={() => setShowDeleteConfirm(critique.id)}
                    >
                      {tCommon("delete")}
                    </button>
                  )}
                </>
              )}
              {isOwner && (
                <>
                  <span aria-hidden> · </span>
                  <button
                    type="button"
                    className="text-destructive hover:text-destructive hover:underline"
                    onClick={() => setShowDeleteCreatorConfirm(critique.id)}
                  >
                    {tCommon("delete")}
                  </button>
                  {!critique.response && (
                    <>
                      <span aria-hidden> · </span>
                      <button
                        type="button"
                        className="hover:text-foreground hover:underline"
                        onClick={() => {
                          setReplyingId(critique.id);
                          setReplyText("");
                        }}
                      >
                        {t("reply")}
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </>
        )}
        {(critique.response || replyingId === critique.id) && (
          <div className="mt-4 ml-3">
            <div className="flex flex-row items-center gap-2 text-accent-foreground">
              <div className="shrink-0" aria-hidden>
                <MessageCircle size={14} strokeWidth={1.5} className="block" />
              </div>
              <div className="text-sm font-medium text-accent-foreground">
                {isOwner ? t("yourReply") : t("creatorReply")}
              </div>
            </div>
            <div className="mt-2 pl-6">
              {critique.response && !(replyingId === critique.id) ? (
                <>
                  {editingResponseId === critique.id ? (
                    <div className="space-y-3">
                      <RichTextEditor
                        value={editResponseText}
                        onChange={setEditResponseText}
                        placeholder={t("responsePlaceholder")}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleEditResponse(critique.id)}
                          disabled={saving}
                        >
                          {saving ? t("saving") : tCommon("save")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingResponseId(null);
                            setEditResponseText("");
                          }}
                        >
                          {tCommon("cancel")}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div
                        className="prose prose-sm dark:prose-invert max-w-none mb-1 font-mono text-sm"
                        dangerouslySetInnerHTML={{
                          __html: critique.response,
                        }}
                      />
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                        <time dateTime={critique.updatedAt}>
                          {formatCritiqueDate(critique.updatedAt)}
                        </time>
                        {isOwner && (
                          <>
                            <span aria-hidden> · </span>
                            <button
                              type="button"
                              className="hover:text-foreground hover:underline"
                              onClick={() => startEditResponse(critique)}
                            >
                              {tCommon("edit")}
                            </button>
                            <span aria-hidden> · </span>
                            <button
                              type="button"
                              className="text-destructive hover:text-destructive hover:underline"
                              onClick={() =>
                                setShowDeleteResponseConfirm(critique.id)
                              }
                            >
                              {tCommon("delete")}
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </>
              ) : replyingId === critique.id ? (
                <div className="space-y-3">
                  <RichTextEditor
                    value={replyText}
                    onChange={setReplyText}
                    placeholder={t("responsePlaceholder")}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleReply(critique.id)}
                      disabled={saving}
                    >
                      {saving ? t("saving") : tCommon("save")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setReplyingId(null);
                        setReplyText("");
                      }}
                    >
                      {tCommon("cancel")}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            {tCommon("loading")}
          </div>
        ) : critiques.length === 0 && !showAddForm ? (
          <div className="text-center py-8 text-muted-foreground">
            {t("noCritiques")}
          </div>
        ) : (
          displayGroups.map((group) => {
            const isOpen = openGroupIds.has(group.id);
            const hasUnseen = group.critiques.some((c) => c.seenAt === null);
            return (
              <Collapsible
                key={group.id}
                open={isOpen}
                onOpenChange={(open) =>
                  setOpenGroupIds((prev) => {
                    const next = new Set(prev);
                    if (open) next.add(group.id);
                    else next.delete(group.id);
                    return next;
                  })
                }
              >
                <div className="mb-3 flex items-center gap-3 rounded-lg bg-muted/60 px-3 py-2">
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0 p-0"
                      aria-expanded={isOpen}
                    >
                      {isOpen ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <div className="shrink-0 text-muted-foreground" aria-hidden>
                    <NotebookPen
                      size={18}
                      strokeWidth={1.5}
                      className="block"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    {group.header}
                  </div>
                  {isOwner && hasUnseen && (
                    <Badge variant="secondary">{t("unseen")}</Badge>
                  )}
                </div>
                <CollapsibleContent>
                  <div className="space-y-4 pl-6">
                    {group.critiques.map((critique, index) => (
                      <div key={critique.id}>
                        {index > 0 && (
                          <div className="my-4 border-t border-dotted border-border" />
                        )}
                        {renderCritiqueBody(critique)}
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })
        )}
        {!isOwner && (
          <div>
            {showAddForm ? (
              <div className="space-y-3">
                <RichTextEditor
                  value={newCritique}
                  onChange={setNewCritique}
                  placeholder={t("critiquePlaceholder")}
                />
                <div className="flex gap-2">
                  <Button onClick={handleAddCritique} disabled={saving}>
                    {saving ? t("saving") : t("addCritique")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewCritique("");
                    }}
                  >
                    {tCommon("cancel")}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={startAddCritique}
                variant="outline"
                className="w-full"
              >
                {t("addCritique")}
              </Button>
            )}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm !== null}
        title={t("deleteCritique")}
        message={t("deleteCritiqueConfirm")}
        confirmLabel={t("deleteCritique")}
        onConfirm={() => {
          if (showDeleteConfirm) {
            handleDeleteCritique(showDeleteConfirm);
          }
        }}
        onCancel={() => setShowDeleteConfirm(null)}
        isLoading={saving}
      />

      <ConfirmModal
        isOpen={showDeleteCreatorConfirm !== null}
        title={t("deleteCritique")}
        message={t("deleteCritiqueConfirm")}
        confirmLabel={t("deleteCritique")}
        onConfirm={() => {
          if (showDeleteCreatorConfirm) {
            handleDeleteCritique(showDeleteCreatorConfirm);
          }
        }}
        onCancel={() => setShowDeleteCreatorConfirm(null)}
        isLoading={saving}
      />

      <ConfirmModal
        isOpen={showDeleteResponseConfirm !== null}
        title={t("deleteReply")}
        message="Are you sure you want to delete this response?"
        confirmLabel={t("deleteReply")}
        onConfirm={() => {
          if (showDeleteResponseConfirm) {
            handleDeleteResponse(showDeleteResponseConfirm);
          }
        }}
        onCancel={() => setShowDeleteResponseConfirm(null)}
        isLoading={saving}
      />
    </>
  );
}
