"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import Link from "@/components/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ConfirmModal } from "@/components/confirm-modal";
import { ChevronDown, ChevronRight, Eye, NotebookPen } from "lucide-react";
import { toast } from "sonner";
import { cn, getCreatorUrl } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SelectionThumbnail } from "@/components/selection-thumbnail";
import { SelectionLightbox } from "@/components/selection-lightbox";
import type { SelectionData } from "@/lib/critique-fragments";

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
  selectionData?: SelectionData | null;
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

function critiqueBubbleClass(align: "incoming" | "outgoing") {
  return cn(
    "min-w-0 max-w-[min(92%,26rem)] px-3.5 py-2.5 shadow-sm",
    align === "incoming"
      ? "rounded-2xl rounded-tl-md border border-border/60 bg-muted/80 text-foreground"
      : "rounded-2xl rounded-tr-md border border-primary/35 bg-primary text-primary-foreground",
  );
}

function critiqueProseClass(align: "incoming" | "outgoing") {
  return cn(
    "prose prose-sm max-w-none flex-1 font-mono text-sm leading-relaxed",
    align === "incoming" ? "dark:prose-invert" : "prose-invert",
  );
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
  const [selectedLightbox, setSelectedLightbox] =
    useState<SelectionData | null>(null);

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
    const critiqueAlign: "incoming" | "outgoing" = isOwner
      ? "incoming"
      : "outgoing";
    const replyAlign: "incoming" | "outgoing" = isOwner
      ? "outgoing"
      : "incoming";

    const metaMutedIncoming =
      "text-xs text-muted-foreground [&_button]:text-muted-foreground [&_button:hover]:text-foreground";
    const metaMutedOutgoing =
      "text-xs text-primary-foreground/80 [&_button]:text-primary-foreground/90 [&_button:hover]:text-primary-foreground";
    const deleteOnPrimary =
      "text-red-200 hover:text-red-100 hover:underline dark:text-red-300 dark:hover:text-red-200";

    return (
      <div className="flex flex-col gap-3">
        {editingId === critique.id ? (
          <div className="w-full rounded-xl border border-border bg-card p-3 shadow-sm space-y-3">
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
          <div
            className={cn(
              "flex w-full min-w-0",
              critiqueAlign === "incoming" ? "justify-start" : "justify-end",
            )}
          >
            <div className={critiqueBubbleClass(critiqueAlign)}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
                <div
                  className={critiqueProseClass(critiqueAlign)}
                  dangerouslySetInnerHTML={{ __html: critique.critique }}
                />
                {critique.selectionData && (
                  <SelectionThumbnail
                    selectionData={critique.selectionData}
                    onClick={() => setSelectedLightbox(critique.selectionData!)}
                  />
                )}
              </div>
              <div
                className={cn(
                  "mt-2 flex flex-wrap items-center gap-x-2 gap-y-1",
                  critiqueAlign === "incoming"
                    ? metaMutedIncoming
                    : metaMutedOutgoing,
                )}
              >
                <time dateTime={critique.createdAt}>
                  {formatCritiqueDate(critique.createdAt)}
                </time>
                {critique.seenAt != null && (
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          className={cn(
                            "inline-flex shrink-0 focus:outline-none",
                            critiqueAlign === "incoming"
                              ? "text-muted-foreground"
                              : "text-primary-foreground/85",
                          )}
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
                        className="hover:underline"
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
                        className={cn(
                          critiqueAlign === "outgoing"
                            ? deleteOnPrimary
                            : "text-destructive hover:text-destructive hover:underline",
                        )}
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
                          className="hover:underline"
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
            </div>
          </div>
        )}

        {critique.response && !(replyingId === critique.id) ? (
          editingResponseId === critique.id ? (
            <div className="w-full rounded-xl border border-border bg-card p-3 shadow-sm space-y-3">
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
            <div
              className={cn(
                "flex w-full min-w-0",
                replyAlign === "incoming" ? "justify-start" : "justify-end",
              )}
            >
              <div
                className={critiqueBubbleClass(replyAlign)}
                aria-label={isOwner ? t("yourReply") : t("creatorReply")}
              >
                <span className="sr-only">
                  {isOwner ? t("yourReply") : t("creatorReply")}
                </span>
                <div
                  className={cn(critiqueProseClass(replyAlign), "flex-none")}
                  dangerouslySetInnerHTML={{
                    __html: critique.response,
                  }}
                />
                <div
                  className={cn(
                    "mt-2 flex flex-wrap items-center gap-x-2 gap-y-1",
                    replyAlign === "incoming"
                      ? metaMutedIncoming
                      : metaMutedOutgoing,
                  )}
                >
                  <time dateTime={critique.updatedAt}>
                    {formatCritiqueDate(critique.updatedAt)}
                  </time>
                  {isOwner && (
                    <>
                      <span aria-hidden> · </span>
                      <button
                        type="button"
                        className="hover:underline"
                        onClick={() => startEditResponse(critique)}
                      >
                        {tCommon("edit")}
                      </button>
                      <span aria-hidden> · </span>
                      <button
                        type="button"
                        className={cn(
                          replyAlign === "outgoing"
                            ? deleteOnPrimary
                            : "text-destructive hover:text-destructive hover:underline",
                        )}
                        onClick={() =>
                          setShowDeleteResponseConfirm(critique.id)
                        }
                      >
                        {tCommon("delete")}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        ) : null}

        {replyingId === critique.id ? (
          <div className="w-full rounded-xl border border-dashed border-primary/40 bg-muted/30 p-3 shadow-sm space-y-3">
            <p className="text-sm font-medium text-foreground">
              {t("yourReply")}
            </p>
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
                <div
                  className={cn(
                    "min-w-0",
                    isOpen &&
                      "mb-4 overflow-hidden rounded-xl border border-border/40 bg-muted/10",
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-2",
                      isOpen
                        ? "border-b border-border/35 bg-muted/45"
                        : "mb-3 rounded-lg bg-muted/60",
                    )}
                  >
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
                    <div className="space-y-4 px-3 pb-3 pt-3 sm:px-4">
                      {group.critiques.map((critique) => (
                        <div key={critique.id} className="min-w-0">
                          {renderCritiqueBody(critique)}
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </div>
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
                data-hint-target="add-critique-button"
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

      <SelectionLightbox
        selectionData={selectedLightbox}
        open={selectedLightbox !== null}
        onClose={() => setSelectedLightbox(null)}
      />
    </>
  );
}
