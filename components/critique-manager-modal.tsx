"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ConfirmModal } from "@/components/confirm-modal";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getCreatorUrl } from "@/lib/utils";

// Heavy TipTap editor - dynamically import
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

interface Critique {
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

interface CritiqueManagerModalContentProps {
  isOpen: boolean;
  onClose: () => void;
  submissionId: string;
  isOwner: boolean;
  currentUserId?: string | null;
  submissionTitle?: string | null;
  onUnseenCountChange?: (count: number) => void;
}

function CritiqueManagerModalContent({
  isOpen,
  onClose,
  submissionId,
  isOwner,
  submissionTitle,
  onUnseenCountChange,
}: CritiqueManagerModalContentProps) {
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

  // Fetch critiques
  useEffect(() => {
    if (isOpen) {
      setHasMarkedAsSeen(false);
      fetchCritiques();
    }
  }, [isOpen, submissionId, isOwner]);

  // Mark all critiques as seen when creator opens modal and critiques are loaded
  useEffect(() => {
    if (isOpen && isOwner && critiques.length > 0 && !hasMarkedAsSeen) {
      markAllAsSeen();
      setHasMarkedAsSeen(true);
    }
  }, [isOpen, isOwner, critiques.length, hasMarkedAsSeen]);

  const fetchCritiques = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/submissions/${submissionId}/critiques`,
      );
      if (response.ok) {
        const data = await response.json();
        setCritiques(data.critiques);
        // Update unseen count
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
    // Refresh critiques to update seen status
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

  const canEdit = (critique: Critique) => {
    return !isOwner && critique.seenAt === null;
  };

  const canDelete = (critique: Critique) => {
    return !isOwner && critique.seenAt === null;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-h-[90vh] max-w-3xl flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle>
              {isOwner ? t("allCritiques") : t("yourCritiques")}
            </DialogTitle>
            <DialogDescription>
              {submissionTitle
                ? `${isOwner ? "View and respond to critiques on" : "Manage your critiques for"} "${submissionTitle}"`
                : isOwner
                  ? "View and respond to critiques on your submission"
                  : "Manage your critiques for this submission"}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 min-h-0 px-6 pb-6 space-y-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                {tCommon("loading")}
              </div>
            ) : critiques.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t("noCritiques")}
              </div>
            ) : (
              critiques.map((critique, index) => (
                <div key={critique.id}>
                  {index > 0 && <div className="border-t border-border my-4" />}
                  <div className="flex items-start gap-3">
                    {isOwner && (
                      <Link href={getCreatorUrl(critique.critiquer)}>
                        <Avatar>
                          <AvatarImage
                            src={critique.critiquer.image || undefined}
                          />
                          <AvatarFallback>
                            {critique.critiquer.name?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                    )}
                    <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-start md:gap-3">
                      <div className="flex-1 min-w-0">
                        {isOwner && (
                          <div className="flex items-center gap-2 mb-2">
                            <Link
                              href={getCreatorUrl(critique.critiquer)}
                              className="font-medium text-foreground hover:underline"
                            >
                              {critique.critiquer.name || t("critiquer")}
                            </Link>
                            {critique.seenAt === null && (
                              <Badge variant="secondary">{t("unseen")}</Badge>
                            )}
                            {critique.seenAt !== null && (
                              <Badge variant="outline">{t("seen")}</Badge>
                            )}
                          </div>
                        )}
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
                              className="prose prose-sm dark:prose-invert max-w-none mb-3"
                              dangerouslySetInnerHTML={{
                                __html: critique.critique,
                              }}
                            />
                          </>
                        )}
                        {critique.response && (
                          <div className="mt-4 pt-4">
                            <div className="text-sm font-medium mb-2">
                              {t("creatorReply")}
                            </div>
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
                                    onClick={() =>
                                      handleEditResponse(critique.id)
                                    }
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
                                  className="prose prose-sm dark:prose-invert max-w-none mb-3"
                                  dangerouslySetInnerHTML={{
                                    __html: critique.response,
                                  }}
                                />
                                {isOwner && (
                                  <div className="flex gap-2">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            size="icon"
                                            variant="outline"
                                            onClick={() =>
                                              startEditResponse(critique)
                                            }
                                          >
                                            <Edit className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>{t("editReply")}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            size="icon"
                                            variant="destructive"
                                            onClick={() =>
                                              setShowDeleteResponseConfirm(
                                                critique.id,
                                              )
                                            }
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>{t("deleteReply")}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}
                        {!critique.response && isOwner && (
                          <div className="mt-4 pt-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setReplyingId(critique.id);
                                setReplyText("");
                              }}
                            >
                              {t("reply")}
                            </Button>
                          </div>
                        )}
                        {replyingId === critique.id && (
                          <div className="mt-4 pt-4 space-y-3">
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
                        )}
                      </div>
                      {!isOwner && (
                        <div className="flex gap-2 md:flex-col md:mt-0 mt-2 shrink-0">
                          <TooltipProvider>
                            {canEdit(critique) ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() => startEdit(critique)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{t("editCritique")}</p>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>
                                    <Button
                                      size="icon"
                                      variant="outline"
                                      disabled
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{t("cannotEdit")}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {canDelete(critique) ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="destructive"
                                    onClick={() =>
                                      setShowDeleteConfirm(critique.id)
                                    }
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{t("deleteCritique")}</p>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>
                                    <Button
                                      size="icon"
                                      variant="destructive"
                                      disabled
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{t("cannotDelete")}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </TooltipProvider>
                        </div>
                      )}
                      {isOwner && (
                        <div className="flex gap-2 md:flex-col md:mt-0 mt-2 shrink-0">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="destructive"
                                  onClick={() =>
                                    setShowDeleteCreatorConfirm(critique.id)
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{t("deleteCritique")}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
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
        </DialogContent>
      </Dialog>

      <ConfirmModal
        isOpen={showDeleteConfirm !== null}
        title={t("deleteCritique")}
        message={t("cannotDelete")}
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

interface CritiqueManagerModalOwnerProps {
  isOpen: boolean;
  onClose: () => void;
  submissionId: string;
  currentUserId?: string | null;
  submissionTitle?: string | null;
  onUnseenCountChange?: (count: number) => void;
}

function CritiqueManagerModalOwner(props: CritiqueManagerModalOwnerProps) {
  return <CritiqueManagerModalContent {...props} isOwner={true} />;
}

interface CritiqueManagerModalViewerProps {
  isOpen: boolean;
  onClose: () => void;
  submissionId: string;
  currentUserId?: string | null;
  submissionTitle?: string | null;
  onUnseenCountChange?: (count: number) => void;
}

function CritiqueManagerModalViewer(props: CritiqueManagerModalViewerProps) {
  return <CritiqueManagerModalContent {...props} isOwner={false} />;
}

export const CritiqueManagerModal = {
  Owner: CritiqueManagerModalOwner,
  Viewer: CritiqueManagerModalViewer,
};
