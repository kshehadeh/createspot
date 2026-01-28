"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Pencil,
  Trash2,
  Star,
  Lock,
  Eye,
  Globe,
  Heart,
  X,
  FolderPlus,
} from "lucide-react";
import { TextThumbnail } from "@/components/text-thumbnail";
import { ConfirmModal } from "@/components/confirm-modal";
import { SubmissionLightbox } from "@/components/submission-lightbox";
import { CollectionSelectModal } from "@/components/collection-select-modal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CATEGORIES, getCategoryIcon } from "@/lib/categories";
import { getObjectPositionStyle } from "@/lib/image-utils";

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
    views: number;
  };
  shareStatus?: "PRIVATE" | "PROFILE" | "PUBLIC";
}

interface PortfolioListEditorProps {
  items: PortfolioItem[];
  totalCount: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  onEdit: (item: PortfolioItem) => void;
  onDelete: (item: PortfolioItem) => Promise<void>;
  onReorder: (items: PortfolioItem[]) => Promise<void>;
  featuredSubmissionId?: string | null;
  onSetFeatured: (item: PortfolioItem) => void;
  onBulkDelete?: (ids: string[]) => Promise<void>;
}

interface SortableListItemProps {
  item: PortfolioItem;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
  isFeatured: boolean;
  onSetFeatured: () => void;
  onView: () => void;
  onCategoryClick: (category: string) => void;
  onTagClick: (tag: string) => void;
  activeCategoryFilter?: string;
  activeTagFilter?: string;
}

function SortableListItem({
  item,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  isFeatured,
  onSetFeatured,
  onView,
  onCategoryClick,
  onTagClick,
  activeCategoryFilter,
  activeTagFilter,
}: SortableListItemProps) {
  const t = useTranslations("portfolioEditor");
  const tCategories = useTranslations("categories");
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const CategoryIcon = getCategoryIcon(item.category);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors ${
        isDragging ? "ring-2 ring-ring" : ""
      } ${isSelected ? "bg-accent border-accent" : "border-border hover:bg-muted/50"}`}
    >
      {/* Checkbox */}
      <Checkbox
        checked={isSelected}
        onCheckedChange={onSelect}
        aria-label={t("selectItem")}
      />

      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
        suppressHydrationWarning
      >
        <GripVertical className="h-5 w-5" />
      </div>

      {/* Thumbnail */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onView();
        }}
        onPointerDown={(e) => {
          // Prevent drag when clicking thumbnail
          e.stopPropagation();
        }}
        className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted cursor-pointer hover:opacity-80 transition-opacity"
        aria-label={t("viewSubmission")}
      >
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.title || t("untitled")}
            fill
            className="object-cover"
            sizes="48px"
            style={{
              objectPosition: getObjectPositionStyle(item.imageFocalPoint),
            }}
          />
        ) : item.text ? (
          <TextThumbnail text={item.text} className="h-full w-full" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <span className="text-xs text-muted-foreground">?</span>
          </div>
        )}
      </button>

      {/* Item Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
            onPointerDown={(e) => {
              // Prevent drag when clicking title
              e.stopPropagation();
            }}
            className="truncate text-sm font-medium text-foreground hover:underline cursor-pointer text-left"
            aria-label={t("viewSubmission")}
          >
            {item.title || t("untitled")}
          </button>
          {isFeatured && (
            <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {CategoryIcon && item.category && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCategoryClick(item.category!);
              }}
              onPointerDown={(e) => {
                // Prevent drag when clicking category
                e.stopPropagation();
              }}
              className={`flex items-center gap-1 transition-colors cursor-pointer ${
                activeCategoryFilter === item.category
                  ? "text-foreground font-medium"
                  : "hover:text-foreground"
              }`}
              aria-label={t("filterByCategory")}
            >
              <CategoryIcon className="h-3 w-3" />
              {tCategories(item.category)}
            </button>
          )}
          {item.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {item.tags.slice(0, 3).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTagClick(tag);
                  }}
                  onPointerDown={(e) => {
                    // Prevent drag when clicking tag
                    e.stopPropagation();
                  }}
                  className={`transition-colors cursor-pointer ${
                    activeTagFilter === tag
                      ? "text-foreground font-medium"
                      : "hover:text-foreground"
                  }`}
                  aria-label={t("filterByTag")}
                >
                  {tag}
                </button>
              ))}
              {item.tags.length > 3 && (
                <span className="text-muted-foreground">
                  +{item.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {item._count.views}
            </span>
          </TooltipTrigger>
          <TooltipContent>{t("views")}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" />
              {item._count.favorites}
            </span>
          </TooltipTrigger>
          <TooltipContent>{t("favorites")}</TooltipContent>
        </Tooltip>
      </div>

      {/* Privacy Badge */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted">
            {item.shareStatus === "PRIVATE" && (
              <Lock className="h-3.5 w-3.5 text-red-500" />
            )}
            {item.shareStatus === "PROFILE" && (
              <Eye className="h-3.5 w-3.5 text-amber-500" />
            )}
            {item.shareStatus === "PUBLIC" && (
              <Globe className="h-3.5 w-3.5 text-green-500" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {item.shareStatus === "PRIVATE" && t("private")}
          {item.shareStatus === "PROFILE" && t("profileOnly")}
          {item.shareStatus === "PUBLIC" && t("public")}
        </TooltipContent>
      </Tooltip>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onEdit}
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">{t("edit")}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("edit")}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 w-8 p-0 ${isFeatured ? "text-amber-500" : ""}`}
              onClick={onSetFeatured}
            >
              <Star className={`h-4 w-4 ${isFeatured ? "fill-current" : ""}`} />
              <span className="sr-only">{t("setAsFeatured")}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isFeatured ? t("removeFromFeatured") : t("setAsFeatured")}
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">{t("delete")}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("delete")}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

export function PortfolioListEditor({
  items,
  totalCount,
  hasMore,
  isLoadingMore,
  onLoadMore,
  onEdit,
  onDelete,
  onReorder,
  featuredSubmissionId,
  onSetFeatured,
  onBulkDelete,
}: PortfolioListEditorProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const t = useTranslations("portfolioEditor");
  const tCategories = useTranslations("categories");

  // Client-side mount state to prevent hydration mismatch with Radix UI Select
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lightbox state
  const [selectedSubmission, setSelectedSubmission] =
    useState<PortfolioItem | null>(null);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter state
  const [categoryFilter, setCategoryFilter] = useState<string>("__all__");
  const [tagFilter, setTagFilter] = useState<string>("__all__");

  // Delete confirmation state
  const [deletingItem, setDeletingItem] = useState<PortfolioItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Collection modal state
  const [showCollectionModal, setShowCollectionModal] = useState(false);

  // Reorder state
  const [isSaving, setIsSaving] = useState(false);
  const [orderedItems, setOrderedItems] = useState<PortfolioItem[]>(items);

  // Get unique tags from all items for filter
  const allTags = Array.from(
    new Set(items.flatMap((item) => item.tags)),
  ).sort();

  // Apply filters
  const filteredItems = orderedItems.filter((item) => {
    if (categoryFilter !== "__all__" && item.category !== categoryFilter) {
      return false;
    }
    if (tagFilter !== "__all__" && !item.tags.includes(tagFilter)) {
      return false;
    }
    return true;
  });

  const hasFilters = categoryFilter !== "__all__" || tagFilter !== "__all__";

  // Get word from prompt for lightbox
  const getWord = (item: PortfolioItem): string => {
    if (!item.prompt || !item.wordIndex) {
      return item.category || "";
    }
    const words = [item.prompt.word1, item.prompt.word2, item.prompt.word3];
    return words[item.wordIndex - 1] || "";
  };

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredItems.map((item) => item.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const isAllSelected =
    filteredItems.length > 0 &&
    filteredItems.every((item) => selectedIds.has(item.id));
  const isSomeSelected = selectedIds.size > 0;

  // Clear filters
  const clearFilters = () => {
    setCategoryFilter("__all__");
    setTagFilter("__all__");
  };

  // Drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = orderedItems.findIndex(
          (item) => item.id === active.id,
        );
        const newIndex = orderedItems.findIndex((item) => item.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newItems = arrayMove(orderedItems, oldIndex, newIndex);
          setOrderedItems(newItems);
          setIsSaving(true);

          try {
            await onReorder(newItems);
            router.refresh();
          } catch (error) {
            console.error("Failed to save order:", error);
            setOrderedItems(items);
          } finally {
            setIsSaving(false);
          }
        }
      }
    },
    [orderedItems, items, onReorder, router],
  );

  // Delete handlers
  const handleDeleteClick = (item: PortfolioItem) => {
    setDeletingItem(item);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;

    setIsDeleting(true);
    try {
      await onDelete(deletingItem);
      setOrderedItems((prev) => prev.filter((p) => p.id !== deletingItem.id));
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(deletingItem.id);
        return newSet;
      });
      setDeletingItem(null);
      router.refresh();
    } catch (error) {
      console.error("Failed to delete item:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Bulk delete
  const handleBulkDeleteConfirm = async () => {
    if (!onBulkDelete || selectedIds.size === 0) return;

    setIsBulkDeleting(true);
    try {
      await onBulkDelete(Array.from(selectedIds));
      setOrderedItems((prev) =>
        prev.filter((item) => !selectedIds.has(item.id)),
      );
      setSelectedIds(new Set());
      setShowBulkDeleteConfirm(false);
      router.refresh();
    } catch (error) {
      console.error("Failed to bulk delete:", error);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Add to collection
  const handleAddToCollection = async (collectionId: string) => {
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
  };

  // Sync items when prop changes
  if (items !== orderedItems && !isSaving) {
    setOrderedItems(items);
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3">
          {mounted ? (
            <>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t("filterByCategory")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">{t("allCategories")}</SelectItem>
                  {CATEGORIES.map((cat) => {
                    const IconComponent = getCategoryIcon(cat);
                    return (
                      <SelectItem key={cat} value={cat}>
                        <div className="flex items-center gap-2">
                          {IconComponent && (
                            <IconComponent className="h-4 w-4" />
                          )}
                          {tCategories(cat)}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              <Select value={tagFilter} onValueChange={setTagFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t("filterByTag")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">{t("allTags")}</SelectItem>
                  {allTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          ) : (
            <>
              {/* Placeholder divs to maintain layout during SSR */}
              <div className="h-10 w-[180px] rounded-md border border-input bg-background" />
              <div className="h-10 w-[180px] rounded-md border border-input bg-background" />
            </>
          )}

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-9"
            >
              <X className="mr-1 h-4 w-4" />
              {t("clearFilters")}
            </Button>
          )}
        </div>

        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 p-3">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={handleSelectAll}
              aria-label={t("selectAll")}
            />
            <span className="text-sm text-muted-foreground">
              {isAllSelected ? t("deselectAll") : t("selectAll")}
              {filteredItems.length > 0 && ` (${filteredItems.length})`}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isSomeSelected && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCollectionModal(true)}
              >
                <FolderPlus className="mr-1 h-4 w-4" />
                {t("addToCollection")}
              </Button>
            )}
            {isSomeSelected && onBulkDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowBulkDeleteConfirm(true)}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                {t("deleteSelected", { count: selectedIds.size })}
              </Button>
            )}

            <span className="text-sm text-muted-foreground">
              {hasFilters
                ? t("showingFiltered", {
                    shown: filteredItems.length,
                    total: totalCount,
                  })
                : t("showingItems", {
                    shown: orderedItems.length,
                    total: totalCount,
                  })}
            </span>
          </div>
        </div>

        {/* Saving indicator */}
        {isSaving && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {t("savingOrder")}
          </div>
        )}

        {/* List */}
        {filteredItems.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredItems.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {filteredItems.map((item) => (
                  <SortableListItem
                    key={item.id}
                    item={item}
                    isSelected={selectedIds.has(item.id)}
                    onSelect={(checked) => handleSelectItem(item.id, checked)}
                    onEdit={() => onEdit(item)}
                    onDelete={() => handleDeleteClick(item)}
                    isFeatured={featuredSubmissionId === item.id}
                    onSetFeatured={() => onSetFeatured(item)}
                    onView={() => setSelectedSubmission(item)}
                    onCategoryClick={(category) => setCategoryFilter(category)}
                    onTagClick={(tag) => setTagFilter(tag)}
                    activeCategoryFilter={
                      categoryFilter !== "__all__" ? categoryFilter : undefined
                    }
                    activeTagFilter={
                      tagFilter !== "__all__" ? tagFilter : undefined
                    }
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="rounded-lg border border-dashed border-border py-12 text-center">
            <p className="text-muted-foreground">
              {hasFilters ? t("noMatchingItems") : t("emptyState")}
            </p>
          </div>
        )}

        {/* Load More */}
        {hasMore && !hasFilters && (
          <div className="flex justify-center pt-4">
            <Button
              variant="outline"
              onClick={onLoadMore}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? (
                <>
                  <svg
                    className="mr-2 h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {t("loading")}
                </>
              ) : (
                t("loadMore")
              )}
            </Button>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingItem && (
          <ConfirmModal
            isOpen={true}
            title={t("deleteTitle")}
            message={t("deleteMessage", {
              title: deletingItem.title || t("untitled"),
            })}
            confirmLabel={t("delete")}
            onConfirm={handleDeleteConfirm}
            onCancel={() => setDeletingItem(null)}
            isLoading={isDeleting}
          />
        )}

        {/* Bulk Delete Confirmation Modal */}
        {showBulkDeleteConfirm && (
          <ConfirmModal
            isOpen={true}
            title={t("bulkDeleteTitle")}
            message={t("bulkDeleteMessage", { count: selectedIds.size })}
            confirmLabel={t("deleteSelected", { count: selectedIds.size })}
            onConfirm={handleBulkDeleteConfirm}
            onCancel={() => setShowBulkDeleteConfirm(false)}
            isLoading={isBulkDeleting}
          />
        )}

        {/* Collection Select Modal */}
        <CollectionSelectModal
          isOpen={showCollectionModal}
          onClose={() => setShowCollectionModal(false)}
          onSelect={handleAddToCollection}
          selectedCount={selectedIds.size}
        />

        {/* Submission Lightbox */}
        {selectedSubmission &&
          (selectedSubmission.imageUrl || selectedSubmission.text) &&
          (() => {
            const currentIndex = filteredItems.findIndex(
              (i) => i.id === selectedSubmission.id,
            );
            const hasPrevious = currentIndex > 0;
            const hasNext =
              currentIndex >= 0 && currentIndex < filteredItems.length - 1;
            return (
              <SubmissionLightbox
                submission={{
                  id: selectedSubmission.id,
                  title: selectedSubmission.title,
                  imageUrl: selectedSubmission.imageUrl,
                  text: selectedSubmission.text,
                  user: session?.user
                    ? {
                        id: session.user.id,
                        name: session.user.name || null,
                        image: session.user.image || null,
                      }
                    : undefined,
                  _count: selectedSubmission._count,
                }}
                word={getWord(selectedSubmission)}
                onClose={() => setSelectedSubmission(null)}
                isOpen={!!selectedSubmission}
                hideGoToSubmission={false}
                currentUserId={session?.user?.id || null}
                onGoToPrevious={() => {
                  if (hasPrevious)
                    setSelectedSubmission(filteredItems[currentIndex - 1]);
                }}
                onGoToNext={() => {
                  if (hasNext)
                    setSelectedSubmission(filteredItems[currentIndex + 1]);
                }}
                hasPrevious={hasPrevious}
                hasNext={hasNext}
              />
            );
          })()}
      </div>
    </TooltipProvider>
  );
}
