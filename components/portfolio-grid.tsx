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
import { SubmissionLightbox } from "@/components/submission-lightbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getCategoryIcon } from "@/lib/categories";
import { Pencil, Trash2, Star } from "lucide-react";

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
  // For exhibit mode - items can come from different users
  user?: {
    id: string;
    name: string | null;
    image: string | null;
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
  // For exhibit mode
  mode?: "portfolio" | "exhibit";
  onRemove?: (item: PortfolioItem) => Promise<void>;
  user?: {
    id: string;
    name: string | null;
    image: string | null;
  };
  featuredSubmissionId?: string | null;
  onSetFeatured?: (item: PortfolioItem) => void;
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
  mode = "portfolio",
  onRemove,
  user,
  featuredSubmissionId,
  onSetFeatured,
}: PortfolioGridProps) {
  const router = useRouter();
  const [orderedItems, setOrderedItems] = useState<PortfolioItem[]>(items);
  const [isSaving, setIsSaving] = useState(false);
  const isReorderingRef = useRef(false);
  const lastItemsRef = useRef<PortfolioItem[]>(items);

  // Update ordered items when items prop changes (but not during reordering)
  useEffect(() => {
    // Check if items prop actually changed (from server or parent state update)
    const itemsChanged =
      items.length !== lastItemsRef.current.length ||
      items.some((item, idx) => {
        const lastItem = lastItemsRef.current[idx];
        if (!lastItem) return true;
        // Check ID and key properties that might change during editing
        return (
          item.id !== lastItem.id ||
          item.title !== lastItem.title ||
          item.imageUrl !== lastItem.imageUrl ||
          item.text !== lastItem.text ||
          item.category !== lastItem.category
        );
      });

    if (itemsChanged && !isReorderingRef.current && !isSaving) {
      setOrderedItems(items);
      lastItemsRef.current = items;
    }
  }, [items, isSaving]);

  const filteredItems = orderedItems;

  const submissionIds = orderedItems.map((s) => s.id);

  const handleReorder = useCallback(
    async (newItems: PortfolioItem[]) => {
      // If onReorder is provided, use it (for exhibit mode)
      if (onReorder) {
        isReorderingRef.current = true;
        setOrderedItems(newItems);
        setIsSaving(true);
        try {
          await onReorder(newItems);
          lastItemsRef.current = newItems;
          setTimeout(() => {
            router.refresh();
            setTimeout(() => {
              isReorderingRef.current = false;
            }, 500);
          }, 200);
        } catch (error) {
          console.error("Failed to save order:", error);
          setOrderedItems(items);
          lastItemsRef.current = items;
          isReorderingRef.current = false;
        } finally {
          setIsSaving(false);
        }
        return;
      }

      // Default portfolio reordering
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
    },
    [items, onReorder, router],
  );

  return (
    <FavoritesProvider
      isLoggedIn={isLoggedIn}
      initialSubmissionIds={submissionIds}
    >
      <PortfolioGridContent
        items={filteredItems}
        allItems={orderedItems}
        isLoggedIn={isLoggedIn}
        isOwnProfile={isOwnProfile}
        showPromptBadge={showPromptBadge}
        allowEdit={allowEdit}
        onEdit={onEdit}
        onDelete={onDelete}
        onReorder={handleReorder}
        isSaving={isSaving}
        mode={mode}
        onRemove={onRemove}
        user={user}
        featuredSubmissionId={featuredSubmissionId}
        onSetFeatured={onSetFeatured}
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
  mode?: "portfolio" | "exhibit";
  onEdit?: (item: PortfolioItem) => void;
  onDeleteClick: (e: React.MouseEvent, item: PortfolioItem) => void;
  onClick: () => void;
  featuredSubmissionId?: string | null;
  onSetFeatured?: (item: PortfolioItem) => void;
}

function SortablePortfolioItem({
  item,
  isLoggedIn,
  allowEdit,
  isDragging,
  mode = "portfolio",
  onEdit,
  onDeleteClick,
  onClick,
  featuredSubmissionId,
  onSetFeatured,
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
      className={`group overflow-hidden border-0 rounded-none transition-shadow duration-300 ${
        isDragging || isSortableDragging ? "ring-2 ring-ring" : ""
      } hover:shadow-[0_0_20px_4px_hsl(var(--ring)/0.3)]`}
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
        <div className="absolute bottom-0 left-0 max-w-[85%] bg-black/70 p-2.5 pr-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <h3 className="truncate text-sm font-medium text-white drop-shadow-sm">
            {item.title || "Untitled"}
          </h3>
          {mode === "exhibit" && item.user && (
            <p className="truncate text-xs text-white/80 mt-0.5">
              by {item.user.name || "Anonymous"}
            </p>
          )}
        </div>

        {/* Category icon in lower right */}
        {(() => {
          const CategoryIcon = getCategoryIcon(item.category);
          return CategoryIcon ? (
            <div className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-lg bg-black/40 backdrop-blur-sm">
              <CategoryIcon className="h-4 w-4 text-white/60" />
            </div>
          ) : null;
        })()}

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

      {/* Edit, Featured, and Delete/Remove buttons below thumbnail (only when editing is allowed) */}
      {allowEdit && (
        <CardContent className="flex gap-2 border-t border-border p-2">
          {mode === "portfolio" && onEdit && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 p-0"
                  onClick={handleEdit}
                >
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit</p>
              </TooltipContent>
            </Tooltip>
          )}
          {mode === "portfolio" && onSetFeatured && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`h-9 w-9 p-0 ${
                    featuredSubmissionId === item.id
                      ? "bg-primary text-primary-foreground"
                      : ""
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetFeatured(item);
                  }}
                >
                  <Star
                    className={`h-4 w-4 ${featuredSubmissionId === item.id ? "fill-current" : ""}`}
                  />
                  <span className="sr-only">Set as Featured</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {featuredSubmissionId === item.id
                    ? "Remove from Featured"
                    : "Set as Featured"}
                </p>
              </TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={(e) => onDeleteClick(e, item)}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">
                  {mode === "exhibit" ? "Remove" : "Delete"}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{mode === "exhibit" ? "Remove" : "Delete"}</p>
            </TooltipContent>
          </Tooltip>
        </CardContent>
      )}
    </Card>
  );
}

function PortfolioGridContent({
  items,
  allItems,
  isLoggedIn,
  isOwnProfile,
  showPromptBadge,
  allowEdit,
  onEdit,
  onDelete,
  onReorder,
  isSaving,
  mode,
  onRemove,
  user,
  featuredSubmissionId,
  onSetFeatured,
}: {
  items: PortfolioItem[];
  allItems: PortfolioItem[];
  isLoggedIn: boolean;
  isOwnProfile: boolean;
  showPromptBadge: boolean;
  allowEdit: boolean;
  onEdit?: (item: PortfolioItem) => void;
  onDelete?: (item: PortfolioItem) => Promise<void>;
  onReorder: (items: PortfolioItem[]) => void;
  isSaving: boolean;
  mode?: "portfolio" | "exhibit";
  onRemove?: (item: PortfolioItem) => Promise<void>;
  user?: {
    id: string;
    name: string | null;
    image: string | null;
  };
  featuredSubmissionId?: string | null;
  onSetFeatured?: (item: PortfolioItem) => void;
}) {
  const router = useRouter();
  const [deletingItem, setDeletingItem] = useState<PortfolioItem | null>(null);
  const [removingItem, setRemovingItem] = useState<PortfolioItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] =
    useState<PortfolioItem | null>(null);

  const getWord = (item: PortfolioItem) => {
    if (!item.prompt || !item.wordIndex) return "";
    const words = [item.prompt.word1, item.prompt.word2, item.prompt.word3];
    return words[item.wordIndex - 1];
  };

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
    if (mode === "exhibit" && onRemove) {
      setRemovingItem(item);
    } else {
      setDeletingItem(item);
    }
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

  const handleRemoveConfirm = async () => {
    if (!removingItem || !onRemove) return;

    setIsRemoving(true);
    try {
      await onRemove(removingItem);
      setRemovingItem(null);
      router.refresh();
    } catch (error) {
      console.error("Failed to remove item from exhibit:", error);
    } finally {
      setIsRemoving(false);
    }
  };

  // Only use DnD when editing is allowed
  const isDndEnabled = allowEdit;

  const gridContent = (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full min-w-0">
      <AnimatePresence mode="popLayout">
        {items.map((item) => {
          const isFeatured = featuredSubmissionId === item.id;
          return (
            <motion.div
              key={item.id}
              layout={!isDndEnabled}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col"
            >
              {isDndEnabled ? (
                <SortablePortfolioItem
                  item={item}
                  isLoggedIn={isLoggedIn}
                  showPromptBadge={showPromptBadge}
                  allowEdit={allowEdit}
                  isDragging={activeId === item.id}
                  mode={mode}
                  onEdit={onEdit}
                  onDeleteClick={handleDeleteClick}
                  onClick={() => {
                    if (item.imageUrl) {
                      setSelectedSubmission(item);
                    } else {
                      router.push(`/s/${item.id}`);
                    }
                  }}
                  featuredSubmissionId={featuredSubmissionId}
                  onSetFeatured={onSetFeatured}
                />
              ) : (
                <div className={isFeatured ? "relative" : ""}>
                  {isFeatured && (
                    <div className="absolute -inset-1 rounded-sm bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 opacity-60 blur-sm" />
                  )}
                  <Card
                    className={`group relative overflow-hidden border-0 rounded-none transition-shadow duration-300 hover:shadow-[0_0_20px_4px_hsl(var(--ring)/0.3)] ${isFeatured ? "ring-2 ring-amber-400/50" : ""}`}
                  >
                    <div
                      className="relative aspect-square cursor-pointer overflow-hidden bg-muted"
                      onClick={() => {
                        if (item.imageUrl) {
                          setSelectedSubmission(item);
                        } else {
                          router.push(`/s/${item.id}`);
                        }
                      }}
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
                        <TextThumbnail
                          text={item.text}
                          className="h-full w-full"
                        />
                      ) : null}

                      {/* Overlay information in lower left */}
                      <div className="absolute bottom-0 left-0 max-w-[85%] bg-black/70 p-2.5 pr-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <h3 className="truncate text-sm font-medium text-white drop-shadow-sm">
                          {item.title || "Untitled"}
                        </h3>
                      </div>

                      {/* Category icon in lower right */}
                      {(() => {
                        const CategoryIcon = getCategoryIcon(item.category);
                        return CategoryIcon ? (
                          <div className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-lg bg-black/40 backdrop-blur-sm">
                            <CategoryIcon className="h-4 w-4 text-white/60" />
                          </div>
                        ) : null;
                      })()}

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
                </div>
              )}
              {isFeatured && (
                <p className="mt-2 text-center text-xs font-medium text-muted-foreground">
                  Featured
                </p>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );

  return (
    <TooltipProvider>
      <div>
        {/* Saving indicator */}
        {isSaving && (
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
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
            Saving order...
          </div>
        )}

        {/* Drag hint when in edit mode */}
        {allowEdit && items.length > 1 && (
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
                href="/portfolio/edit"
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

        {/* Remove from Exhibit Confirmation Modal */}
        {removingItem && (
          <ConfirmModal
            isOpen={true}
            title="Remove from Exhibit"
            message={`Are you sure you want to remove "${removingItem.title || "this item"}" from this exhibit? The submission will remain in the creator's portfolio.`}
            confirmLabel="Remove"
            onConfirm={handleRemoveConfirm}
            onCancel={() => setRemovingItem(null)}
            isLoading={isRemoving}
          />
        )}

        {/* Lightbox */}
        {selectedSubmission && (
          <SubmissionLightbox
            submission={{
              id: selectedSubmission.id,
              title: selectedSubmission.title,
              imageUrl: selectedSubmission.imageUrl,
              text: selectedSubmission.text,
              user:
                mode === "exhibit" && selectedSubmission.user
                  ? selectedSubmission.user
                  : user,
              _count: selectedSubmission._count,
            }}
            word={getWord(selectedSubmission)}
            onClose={() => setSelectedSubmission(null)}
            isOpen={!!selectedSubmission}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
