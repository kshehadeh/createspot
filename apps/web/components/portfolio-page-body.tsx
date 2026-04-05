"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { FolderPlus, Trash2 } from "lucide-react";
import {
  PortfolioAddWorkSection,
  type PortfolioAddWorkSubmissionOption,
} from "@/components/portfolio-add-work-section";
import {
  PortfolioMobileMenu,
  type PortfolioMobileFilterProps,
} from "@/components/portfolio-mobile-menu";
import {
  PortfolioGridProfile,
  type PortfolioItem,
} from "@/components/portfolio-grid";
import { CollectionSelectModal } from "@/components/collection-select-modal";
import { ConfirmModal } from "@/components/confirm-modal";
import { SubmissionEditModal } from "@/components/submission-edit-modal";
import { Button } from "@createspot/ui-primitives/button";
import { Checkbox } from "@/components/ui/checkbox";

interface PortfolioPageBodyProps {
  items: PortfolioItem[];
  isLoggedIn: boolean;
  isOwnPortfolio: boolean;
  user: {
    id: string;
    slug?: string | null;
    name: string | null;
    image: string | null;
  };
  featuredSubmissionId: string | null;
  sortAllowsReorder: boolean;
  submissionsForAddWork?: PortfolioAddWorkSubmissionOption[];
  /** Mobile header (owner): title + filter / selection controls */
  portfolioTitle?: string;
  filterProps?: PortfolioMobileFilterProps;
}

export function PortfolioPageBody({
  items,
  isLoggedIn,
  isOwnPortfolio,
  user,
  featuredSubmissionId: initialFeaturedId,
  sortAllowsReorder,
  submissionsForAddWork,
  portfolioTitle,
  filterProps,
}: PortfolioPageBodyProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const t = useTranslations("portfolio");
  const tProfile = useTranslations("profile");
  const tEditor = useTranslations("portfolioEditor");

  const [featuredSubmissionId, setFeaturedSubmissionId] = useState<
    string | null
  >(initialFeaturedId);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);

  useEffect(() => {
    setFeaturedSubmissionId(initialFeaturedId);
  }, [initialFeaturedId]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [searchParamsKey]);

  const selectedSet = useMemo(() => selectedIds, [selectedIds]);

  const handleToggleSelect = useCallback((id: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const visibleIds = useMemo(() => items.map((i) => i.id), [items]);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedSet.has(id));
  const isSomeSelected = selectedSet.size > 0;

  const handleSelectAllVisible = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedIds(new Set(visibleIds));
      } else {
        setSelectedIds(new Set());
      }
    },
    [visibleIds],
  );

  const handleSetFeatured = useCallback(
    async (item: PortfolioItem) => {
      const newFeaturedId = featuredSubmissionId === item.id ? null : item.id;
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          featuredSubmissionId: newFeaturedId,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to set featured submission");
      }
      setFeaturedSubmissionId(newFeaturedId);
      router.refresh();
    },
    [featuredSubmissionId, router],
  );

  const handleAddToCollection = useCallback(
    async (collectionId: string) => {
      const response = await fetch(
        `/api/collections/${collectionId}/submissions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ submissionIds: Array.from(selectedIds) }),
        },
      );
      if (!response.ok) {
        throw new Error("Failed to add to collection");
      }
      setSelectedIds(new Set());
      setShowCollectionModal(false);
      router.refresh();
    },
    [selectedIds, router],
  );

  const handleBulkDeleteConfirm = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setIsBulkDeleting(true);
    setBulkError(null);
    try {
      const results = await Promise.all(
        Array.from(selectedIds).map((id) =>
          fetch(`/api/submissions/${id}`, { method: "DELETE" }),
        ),
      );
      const failed = results.filter((r) => !r.ok).length;
      if (failed > 0) {
        setBulkError(t("bulkDeletePartialError", { count: failed }));
      }
      setSelectedIds(new Set());
      setShowBulkDeleteConfirm(false);
      router.refresh();
    } catch {
      setBulkError(t("deleteError"));
    } finally {
      setIsBulkDeleting(false);
    }
  }, [selectedIds, router, t]);

  return (
    <div>
      {isOwnPortfolio && portfolioTitle && filterProps && (
        <div className="mb-4 flex w-full items-start gap-4 md:mb-8">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt={user.name || "User"}
              className="hidden h-12 w-12 shrink-0 rounded-full md:block"
            />
          ) : (
            <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted md:flex">
              <span className="text-lg font-medium text-muted-foreground">
                {user.name?.charAt(0) || "?"}
              </span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <PortfolioMobileMenu
              title={portfolioTitle}
              subtitle={`${items.length} ${
                items.length !== 1 ? tProfile("works") : tProfile("work")
              }`}
              userId={user.id}
              filterProps={filterProps}
              showSelectionToggle
              selectionMode={selectionMode}
              onSelectionModeToggle={() => {
                setSelectionMode((m) => !m);
                setSelectedIds(new Set());
              }}
            />
          </div>
        </div>
      )}

      {bulkError && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {bulkError}
        </div>
      )}

      {isOwnPortfolio && selectionMode && visibleIds.length > 0 && (
        <div className="mb-3 flex items-center gap-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <Checkbox
              checked={allVisibleSelected}
              onCheckedChange={(c) => handleSelectAllVisible(c === true)}
            />
            {allVisibleSelected ? tEditor("deselectAll") : tEditor("selectAll")}
            {` (${visibleIds.length})`}
          </label>
        </div>
      )}

      {isOwnPortfolio && selectionMode && isSomeSelected && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 p-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowCollectionModal(true)}
          >
            <FolderPlus className="mr-2 h-4 w-4" />
            {tEditor("addToCollection")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => setShowBulkDeleteConfirm(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {tEditor("deleteSelected", { count: selectedIds.size })}
          </Button>
        </div>
      )}

      {!sortAllowsReorder && isOwnPortfolio && items.length > 1 && (
        <p className="mb-3 text-xs text-muted-foreground">{t("reorderHint")}</p>
      )}

      <PortfolioGridProfile
        items={items}
        isLoggedIn={isLoggedIn}
        isOwnProfile={isOwnPortfolio}
        user={user}
        featuredSubmissionId={featuredSubmissionId}
        onSetFeatured={isOwnPortfolio ? handleSetFeatured : undefined}
        sortAllowsReorder={sortAllowsReorder}
        onEditItem={isOwnPortfolio ? (item) => setEditingItem(item) : undefined}
        selectionMode={isOwnPortfolio && selectionMode}
        selectedIds={selectedSet}
        onToggleSelect={isOwnPortfolio ? handleToggleSelect : undefined}
      />

      {isOwnPortfolio && submissionsForAddWork && (
        <PortfolioAddWorkSection submissions={submissionsForAddWork} />
      )}

      {editingItem && (
        <SubmissionEditModal
          isOpen={true}
          onClose={() => setEditingItem(null)}
          initialData={{
            id: editingItem.id,
            title: editingItem.title,
            imageUrl: editingItem.imageUrl,
            imageFocalPoint: editingItem.imageFocalPoint,
            text: editingItem.text,
            tags: editingItem.tags,
            category: editingItem.category,
            shareStatus: editingItem.shareStatus,
          }}
          onSuccess={() => {
            setEditingItem(null);
            router.refresh();
          }}
        />
      )}

      <CollectionSelectModal
        isOpen={showCollectionModal}
        onClose={() => setShowCollectionModal(false)}
        onSelect={handleAddToCollection}
        selectedCount={selectedIds.size}
      />

      <ConfirmModal
        isOpen={showBulkDeleteConfirm}
        title={tEditor("bulkDeleteTitle")}
        message={tEditor("bulkDeleteMessage", {
          count: selectedIds.size,
        })}
        confirmLabel={tEditor("deleteSelected", {
          count: selectedIds.size,
        })}
        onConfirm={handleBulkDeleteConfirm}
        onCancel={() => setShowBulkDeleteConfirm(false)}
        isLoading={isBulkDeleting}
      />
    </div>
  );
}
