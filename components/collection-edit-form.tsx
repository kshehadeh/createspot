"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Trash2, Lock, Globe, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PortfolioGrid } from "@/components/portfolio-grid";
import { ConfirmModal } from "@/components/confirm-modal";
import { SubmissionSelector } from "@/components/submission-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface PortfolioItem {
  id: string;
  title: string | null;
  imageUrl: string | null;
  imageFocalPoint?: { x: number; y: number } | null;
  text: string | null;
  isPortfolio: boolean;
  portfolioOrder: number | null;
  tags: string[];
  category: string | null;
  promptId: string | null;
  wordIndex: number | null;
  prompt: {
    word1: string;
    word2: string;
    word3: string;
  } | null;
  _count: {
    favorites: number;
  };
  shareStatus?: "PRIVATE" | "PROFILE" | "PUBLIC";
}

interface CollectionEditFormProps {
  collection: {
    id: string;
    name: string;
    description: string | null;
    isPublic: boolean;
    userId: string;
  };
  items: PortfolioItem[];
  userId: string;
}

export function CollectionEditForm({
  collection,
  items: initialItems,
  userId,
}: CollectionEditFormProps) {
  const router = useRouter();
  const t = useTranslations("collections");
  const tCommon = useTranslations("common");

  const [name, setName] = useState(collection.name);
  const [description, setDescription] = useState(collection.description || "");
  const [isPublic, setIsPublic] = useState(collection.isPublic);
  const [items, setItems] = useState(initialItems);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/collections/${collection.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          isPublic,
        }),
      });

      if (response.ok) {
        setHasChanges(false);
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to save collection:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/collections/${collection.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push(`/creators/${userId}/collections`);
      }
    } catch (error) {
      console.error("Failed to delete collection:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReorder = useCallback(
    async (newItems: PortfolioItem[]) => {
      setItems(newItems);

      const response = await fetch(
        `/api/collections/${collection.id}/reorder`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            submissionIds: newItems.map((item) => item.id),
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to save order");
      }
    },
    [collection.id],
  );

  const handleRemoveItem = useCallback(
    async (item: PortfolioItem) => {
      const response = await fetch(
        `/api/collections/${collection.id}/submissions`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ submissionIds: [item.id] }),
        },
      );

      if (response.ok) {
        setItems((prev) => prev.filter((i) => i.id !== item.id));
      }
    },
    [collection.id],
  );

  const handleAddSubmission = useCallback(
    async (submission: any) => {
      const response = await fetch(
        `/api/collections/${collection.id}/submissions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ submissionIds: [submission.id] }),
        },
      );

      if (response.ok) {
        // Fetch the updated submission to get full details
        const detailResponse = await fetch(`/api/submissions/${submission.id}`);
        if (detailResponse.ok) {
          const data = await detailResponse.json();
          const newItem = {
            id: data.submission.id,
            title: data.submission.title,
            imageUrl: data.submission.imageUrl,
            imageFocalPoint: data.submission.imageFocalPoint,
            text: data.submission.text,
            isPortfolio: data.submission.isPortfolio,
            portfolioOrder: items.length,
            tags: data.submission.tags,
            category: data.submission.category,
            promptId: data.submission.promptId,
            wordIndex: data.submission.wordIndex,
            prompt: data.submission.prompt,
            _count: data.submission._count,
            shareStatus: data.submission.shareStatus,
          };
          setItems((prev) => [...prev, newItem]);
        }
      }
    },
    [collection.id, items.length],
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title={
            <div className="flex items-center gap-2">
              <span>{t("editCollection")}</span>
              {isPublic ? (
                <Globe className="h-4 w-4 shrink-0 text-green-500" />
              ) : (
                <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
            </div>
          }
          subtitle={`${items.length} ${items.length !== 1 ? t("items") : t("item")}`}
        />
        <div className="flex flex-row flex-wrap items-end justify-end gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden md:inline">{t("delete")}</span>
          </Button>
        </div>
      </div>

      {/* Settings */}
      <div>
        <h2 className="mb-4 text-lg font-medium">{t("settings")}</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("collectionName")}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setHasChanges(true);
              }}
              placeholder={t("collectionNamePlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("description")}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setHasChanges(true);
              }}
              placeholder={t("descriptionPlaceholder")}
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="isPublic">{t("makePublic")}</Label>
              <p className="text-xs text-muted-foreground">
                {t("makePublicDescription")}
              </p>
            </div>
            <Switch
              id="isPublic"
              checked={isPublic}
              onCheckedChange={(checked) => {
                setIsPublic(checked);
                setHasChanges(true);
              }}
            />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={!name.trim() || !hasChanges || isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {tCommon("saving")}
                </>
              ) : (
                t("saveSettings")
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Add Submission */}
      <div>
        <h2 className="mb-4 text-lg font-medium">{t("addItems")}</h2>
        <SubmissionSelector
          onSelect={handleAddSubmission}
          excludeIds={items.map((item) => item.id)}
          placeholder={t("selectSubmissionPlaceholder")}
        />
      </div>

      {/* Items */}
      <div>
        {items.length > 0 ? (
          <PortfolioGrid
            items={items}
            isLoggedIn={true}
            isOwnProfile={true}
            allowEdit={true}
            mode="exhibit"
            context="collection"
            onReorder={handleReorder}
            onRemove={handleRemoveItem}
            user={{
              id: userId,
              name: null,
              image: null,
            }}
          />
        ) : (
          <div className="rounded-lg border border-dashed border-border py-16 text-center">
            <p className="text-muted-foreground">{t("emptyCollection")}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("addItemsHint")}
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <ConfirmModal
          isOpen={true}
          title={t("deleteCollection")}
          message={t("deleteCollectionConfirm", { name: collection.name })}
          confirmLabel={t("delete")}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}
