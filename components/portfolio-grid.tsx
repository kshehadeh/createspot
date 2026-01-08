"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TextThumbnail } from "@/components/text-thumbnail";
import { FavoriteButton } from "@/components/favorite-button";
import { FavoritesProvider } from "@/components/favorites-provider";
import { ConfirmModal } from "@/components/confirm-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PortfolioItem {
  id: string;
  title: string | null;
  imageUrl: string | null;
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
}

interface PortfolioGridProps {
  items: PortfolioItem[];
  isLoggedIn: boolean;
  isOwnProfile?: boolean;
  showPromptBadge?: boolean;
  allowEdit?: boolean;
  onEdit?: (item: PortfolioItem) => void;
  onDelete?: (item: PortfolioItem) => Promise<void>;
  onReorder?: (items: PortfolioItem[]) => void;
}

export function PortfolioGrid({
  items,
  isLoggedIn,
  isOwnProfile = false,
  showPromptBadge = true,
  allowEdit = false,
  onEdit,
  onDelete,
  onReorder,
}: PortfolioGridProps) {
  const router = useRouter();
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [orderedItems, setOrderedItems] = useState<PortfolioItem[]>(items);
  const [isSaving, setIsSaving] = useState(false);
  const isReorderingRef = useRef(false);
  const lastItemsRef = useRef<PortfolioItem[]>(items);

  // Update ordered items when items prop changes (but not during reordering)
  useEffect(() => {
    // Check if items prop actually changed (from server)
    const itemsChanged = 
      items.length !== lastItemsRef.current.length || 
      items.some((item, idx) => item.id !== lastItemsRef.current[idx]?.id);
    
    if (itemsChanged && !isReorderingRef.current && !isSaving) {
      setOrderedItems(items);
      lastItemsRef.current = items;
    }
  }, [items, isSaving]);

  // Get unique categories
  const categories = Array.from(
    new Set(
      orderedItems.filter((item) => item.category).map((item) => item.category!),
    ),
  );

  const filteredItems = categoryFilter
    ? orderedItems.filter((item) => item.category === categoryFilter)
    : orderedItems;

  const submissionIds = orderedItems.map((s) => s.id);

  const handleReorder = useCallback(async (newItems: PortfolioItem[]) => {
    // Update portfolioOrder values in the items
    const itemsWithOrder = newItems.map((item, index) => ({
      ...item,
      portfolioOrder: index + 1,
    }));
    
    // Optimistically update the UI
    isReorderingRef.current = true;
    setOrderedItems(itemsWithOrder);
    setIsSaving(true);
    
    try {
      const response = await fetch("/api/submissions/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionIds: newItems.map((item) => item.id),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save order");
      }

      // Update the ref to match the new order so we don't reset on next prop update
      lastItemsRef.current = itemsWithOrder;
      onReorder?.(itemsWithOrder);
      
      // Refresh to get updated data from server after a delay to ensure state is stable
      setTimeout(() => {
        router.refresh();
        // Allow prop updates after refresh completes
        setTimeout(() => {
          isReorderingRef.current = false;
        }, 500);
      }, 200);
    } catch (error) {
      console.error("Failed to save portfolio order:", error);
      // Revert to original order on error
      setOrderedItems(items);
      lastItemsRef.current = items;
      isReorderingRef.current = false;
    } finally {
      setIsSaving(false);
    }
  }, [items, onReorder, router]);

  return (
    <FavoritesProvider
      isLoggedIn={isLoggedIn}
      initialSubmissionIds={submissionIds}
    >
      <PortfolioGridContent
        items={filteredItems}
        allItems={orderedItems}
        categories={categories}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        isLoggedIn={isLoggedIn}
        isOwnProfile={isOwnProfile}
        showPromptBadge={showPromptBadge}
        allowEdit={allowEdit}
        onEdit={onEdit}
        onDelete={onDelete}
        onReorder={handleReorder}
        isSaving={isSaving}
      />
    </FavoritesProvider>
  );
}

interface SortablePortfolioItemProps {
  item: PortfolioItem;
  isLoggedIn: boolean;
  showPromptBadge: boolean;
  allowEdit: boolean;
  isDragging?: boolean;
  onEdit?: (item: PortfolioItem) => void;
  onDeleteClick: (e: React.MouseEvent, item: PortfolioItem) => void;
  onClick: () => void;
}

function SortablePortfolioItem({
  item,
  isLoggedIn,
  showPromptBadge,
  allowEdit,
  isDragging,
  onEdit,
  onDeleteClick,
  onClick,
}: SortablePortfolioItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
    zIndex: isSortableDragging ? 50 : undefined,
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(item);
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`group overflow-hidden rounded-lg ${
        isDragging || isSortableDragging ? "ring-2 ring-ring" : ""
      }`}
    >
      <div
        className="relative aspect-square cursor-pointer overflow-hidden bg-muted"
        onClick={onClick}
      >
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.title || "Portfolio item"}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : item.text ? (
          <TextThumbnail text={item.text} className="h-full w-full" />
        ) : null}

        {/* Drag handle indicator in top left (only in edit mode) */}
        {allowEdit && (
          <div
            {...attributes}
            {...listeners}
            className="absolute top-2 left-2 flex h-7 w-7 cursor-grab items-center justify-center rounded-lg bg-black/60 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 active:cursor-grabbing"
            onClick={(e) => e.stopPropagation()}
          >
            <svg
              className="h-4 w-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8h16M4 16h16"
              />
            </svg>
          </div>
        )}

        {/* Overlay information in lower left */}
        <div className="absolute bottom-0 left-0 max-w-[85%] bg-gradient-to-tr from-black/80 via-black/70 to-transparent p-2.5 pr-6">
          <div className="flex flex-wrap items-center gap-1.5">
            {item.category && (
              <Badge className="rounded-full border-0 bg-white/20 text-white backdrop-blur-sm hover:bg-white/30">
                {item.category}
              </Badge>
            )}
            {showPromptBadge && item.promptId && item.prompt && (
              <Badge className="rounded-full border-0 bg-emerald-500/80 text-white backdrop-blur-sm hover:bg-emerald-500/90">
                {item.wordIndex
                  ? [
                      item.prompt.word1,
                      item.prompt.word2,
                      item.prompt.word3,
                    ][item.wordIndex - 1]
                  : "Prompt"}
              </Badge>
            )}
          </div>
          {item.title && (
            <h3 className="mt-1 line-clamp-1 text-sm font-medium text-white drop-shadow-sm">
              {item.title}
            </h3>
          )}
        </div>

        {/* Favorite button in top right */}
        {isLoggedIn && (
          <div
            className="absolute top-2 right-2"
            onClick={(e) => e.stopPropagation()}
          >
            <FavoriteButton submissionId={item.id} size="sm" />
          </div>
        )}

        {/* Text indicator in top right (if no favorite button) */}
        {item.text && !isLoggedIn && (
          <div className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-lg bg-black/60 backdrop-blur-sm">
            <svg
              className="h-3.5 w-3.5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h7"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Edit and Delete buttons below thumbnail (only when editing is allowed) */}
      {allowEdit && (
        <CardContent className="flex gap-2 border-t border-border p-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-xs"
            onClick={handleEdit}
          >
            <svg
              className="mr-1.5 h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={(e) => onDeleteClick(e, item)}
          >
            <svg
              className="mr-1.5 h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Delete
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

function PortfolioGridContent({
  items,
  allItems,
  categories,
  categoryFilter,
  setCategoryFilter,
  isLoggedIn,
  isOwnProfile,
  showPromptBadge,
  allowEdit,
  onEdit,
  onDelete,
  onReorder,
  isSaving,
}: {
  items: PortfolioItem[];
  allItems: PortfolioItem[];
  categories: string[];
  categoryFilter: string | null;
  setCategoryFilter: (category: string | null) => void;
  isLoggedIn: boolean;
  isOwnProfile: boolean;
  showPromptBadge: boolean;
  allowEdit: boolean;
  onEdit?: (item: PortfolioItem) => void;
  onDelete?: (item: PortfolioItem) => Promise<void>;
  onReorder: (items: PortfolioItem[]) => void;
  isSaving: boolean;
}) {
  const router = useRouter();
  const [deletingItem, setDeletingItem] = useState<PortfolioItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = allItems.findIndex((item) => item.id === active.id);
      const newIndex = allItems.findIndex((item) => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newItems = arrayMove(allItems, oldIndex, newIndex);
        onReorder(newItems);
      }
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, item: PortfolioItem) => {
    e.stopPropagation();
    setDeletingItem(item);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;

    setIsDeleting(true);
    try {
      if (onDelete) {
        await onDelete(deletingItem);
      } else {
        const response = await fetch(`/api/submissions/${deletingItem.id}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          throw new Error("Failed to delete");
        }
        router.refresh();
      }
      setDeletingItem(null);
    } catch (error) {
      console.error("Failed to delete portfolio item:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Only use DnD when editing is allowed and no category filter is active
  const isDndEnabled = allowEdit && !categoryFilter;

  const gridContent = (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <AnimatePresence mode="popLayout">
        {items.map((item) => (
          <motion.div
            key={item.id}
            layout={!isDndEnabled}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            {isDndEnabled ? (
              <SortablePortfolioItem
                item={item}
                isLoggedIn={isLoggedIn}
                showPromptBadge={showPromptBadge}
                allowEdit={allowEdit}
                isDragging={activeId === item.id}
                onEdit={onEdit}
                onDeleteClick={handleDeleteClick}
                onClick={() => router.push(`/s/${item.id}`)}
              />
            ) : (
              <Card className="group overflow-hidden rounded-lg">
                <div
                  className="relative aspect-square cursor-pointer overflow-hidden bg-muted"
                  onClick={() => router.push(`/s/${item.id}`)}
                >
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.title || "Portfolio item"}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  ) : item.text ? (
                    <TextThumbnail text={item.text} className="h-full w-full" />
                  ) : null}

                  {/* Overlay information in lower left */}
                  <div className="absolute bottom-0 left-0 max-w-[85%] bg-gradient-to-tr from-black/80 via-black/70 to-transparent p-2.5 pr-6">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {item.category && (
                        <Badge className="rounded-full border-0 bg-white/20 text-white backdrop-blur-sm hover:bg-white/30">
                          {item.category}
                        </Badge>
                      )}
                      {showPromptBadge && item.promptId && item.prompt && (
                        <Badge className="rounded-full border-0 bg-prompt/80 text-white backdrop-blur-sm hover:bg-prompt/90">
                          {item.wordIndex
                            ? [
                                item.prompt.word1,
                                item.prompt.word2,
                                item.prompt.word3,
                              ][item.wordIndex - 1]
                            : "Prompt"}
                        </Badge>
                      )}
                    </div>
                    {item.title && (
                      <h3 className="mt-1 line-clamp-1 text-sm font-medium text-white drop-shadow-sm">
                        {item.title}
                      </h3>
                    )}
                  </div>

                  {/* Favorite button in top right */}
                  {isLoggedIn && (
                    <div
                      className="absolute top-2 right-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FavoriteButton submissionId={item.id} size="sm" />
                    </div>
                  )}

                  {/* Text indicator in top right (if no favorite button) */}
                  {item.text && !isLoggedIn && (
                    <div className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-lg bg-black/60 backdrop-blur-sm">
                      <svg
                        className="h-3.5 w-3.5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 6h16M4 12h16M4 18h7"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );

  return (
    <div>
      {categories.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCategoryFilter(null)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              categoryFilter === null
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            All
          </motion.button>
          {categories.map((category) => (
            <motion.button
              key={category}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCategoryFilter(category)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                categoryFilter === category
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              {category}
            </motion.button>
          ))}
        </div>
      )}

      {/* Saving indicator */}
      {isSaving && (
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
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
          Saving order...
        </div>
      )}

      {/* Drag hint when in edit mode */}
      {allowEdit && items.length > 1 && !categoryFilter && (
        <p className="mb-4 text-xs text-muted-foreground">
          Drag items to reorder your portfolio
        </p>
      )}

      {isDndEnabled ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={(event) => setActiveId(event.active.id as string)}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <SortableContext
            items={items.map((item) => item.id)}
            strategy={rectSortingStrategy}
          >
            {gridContent}
          </SortableContext>
        </DndContext>
      ) : (
        gridContent
      )}

      {items.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-lg border border-dashed border-border py-12 text-center"
        >
          <p className="text-muted-foreground">
            {isOwnProfile
              ? "No portfolio items yet. Add your creative work to showcase it here."
              : "No portfolio items to display."}
          </p>
          {isOwnProfile && (
            <Link
              href="/profile/edit"
              className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Add Portfolio Item
            </Link>
          )}
        </motion.div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <ConfirmModal
          isOpen={true}
          title="Delete Portfolio Item"
          message={`Are you sure you want to delete "${deletingItem.title || "this item"}" from your portfolio? This action cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingItem(null)}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}
