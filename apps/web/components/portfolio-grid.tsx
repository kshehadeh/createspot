"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence, motion } from "framer-motion";
import { Construction, Pencil, Star, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "@/components/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { LIGHTBOX_BUTTON_CLASS } from "@/components/base-lightbox";
import { ConfirmModal } from "@/components/confirm-modal";
import { FavoriteButton } from "@/components/favorite-button";
import { FavoritesProvider } from "@/components/favorites-provider";
import { SubmissionLightbox } from "@/components/submission-lightbox";
import { TextThumbnail } from "@/components/text-thumbnail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getObjectPositionStyle } from "@/lib/image-utils";
import { cn, getCreatorUrl } from "@/lib/utils";

// Prevent right-click context menu on images for download protection
const handleImageContextMenu = (e: React.MouseEvent) => {
  e.preventDefault();
  return false;
};

/** Folded top-right corner with star for profile featured portfolio piece */
function PortfolioFeaturedDogear() {
  const t = useTranslations("portfolio");
  return (
    <>
      <span className="sr-only">{t("featured")}</span>
      <div
        className="pointer-events-none absolute top-0 right-0 z-[11]"
        aria-hidden
      >
        <div className="relative h-12 w-12">
          <div
            className="absolute top-0 right-0 size-12 bg-gradient-to-br from-amber-300 via-amber-500 to-amber-600 shadow-[2px_2px_6px_rgba(0,0,0,0.18)] dark:from-amber-500 dark:via-amber-600 dark:to-amber-800"
            style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }}
          />
          <Star
            className="absolute top-1 right-1 size-3.5 fill-amber-950 text-amber-950 drop-shadow-sm dark:fill-amber-50 dark:text-amber-50"
            strokeWidth={1.5}
            aria-hidden
          />
        </div>
      </div>
    </>
  );
}

export interface PortfolioItem {
  id: string;
  title: string | null;
  imageUrl: string | null;
  imageFocalPoint?: { x: number; y: number } | null;
  text: string | null;
  isPortfolio: boolean;
  portfolioOrder: number | null;
  tags: string[];
  category: string | null;
  _count: {
    favorites: number;
  };
  shareStatus?: "PRIVATE" | "PROFILE" | "PUBLIC";
  critiquesEnabled?: boolean;
  isWorkInProgress?: boolean;
  latestProgressionImageUrl?: string | null;
  latestProgressionText?: string | null;
  user?: {
    id: string;
    slug?: string | null;
    name: string | null;
    image: string | null;
  };
}

function PortfolioGridFrame({
  items: _items,
  isLoggedIn,
  submissionIds,
  children,
}: {
  items: PortfolioItem[];
  isLoggedIn: boolean;
  submissionIds: string[];
  children: React.ReactNode;
}) {
  return (
    <FavoritesProvider
      isLoggedIn={isLoggedIn}
      initialSubmissionIds={submissionIds}
    >
      {children}
    </FavoritesProvider>
  );
}

interface PortfolioGridProfileProps {
  items: PortfolioItem[];
  isLoggedIn: boolean;
  isOwnProfile: boolean;
  user?: {
    id: string;
    slug?: string | null;
    name: string | null;
    image: string | null;
  };
  featuredSubmissionId?: string | null;
  onSetFeatured?: (item: PortfolioItem) => void | Promise<void>;
  /** When true and `isOwnProfile`, drag-and-drop updates `/api/submissions/reorder`. */
  sortAllowsReorder?: boolean;
  onEditItem?: (item: PortfolioItem) => void;
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string, selected: boolean) => void;
}

export function PortfolioGridProfile({
  items,
  isLoggedIn,
  isOwnProfile,
  user,
  featuredSubmissionId,
  onSetFeatured,
  sortAllowsReorder = false,
  onEditItem,
  selectionMode = false,
  selectedIds,
  onToggleSelect,
}: PortfolioGridProfileProps) {
  const router = useRouter();
  const [orderedItems, setOrderedItems] = useState<PortfolioItem[]>(items);
  const [isSaving, setIsSaving] = useState(false);
  const isReorderingRef = useRef(false);
  const lastItemsRef = useRef<PortfolioItem[]>(items);
  useEffect(() => {
    const itemsChanged =
      items.length !== lastItemsRef.current.length ||
      items.some((item, idx) => {
        const lastItem = lastItemsRef.current[idx];
        if (!lastItem) return true;
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

  const handleReorder = useCallback(
    async (newItems: PortfolioItem[]) => {
      if (!isOwnProfile || !sortAllowsReorder) return;
      isReorderingRef.current = true;
      setOrderedItems(newItems);
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
    },
    [isOwnProfile, sortAllowsReorder, items, router],
  );

  const submissionIds = orderedItems.map((s) => s.id);
  const manageToolbar = isOwnProfile;
  const enableDragReorder = isOwnProfile && sortAllowsReorder;

  return (
    <PortfolioGridFrame
      items={orderedItems}
      isLoggedIn={isLoggedIn}
      submissionIds={submissionIds}
    >
      <PortfolioGridContent
        items={orderedItems}
        allItems={orderedItems}
        isLoggedIn={isLoggedIn}
        isOwnProfile={isOwnProfile}
        manageToolbar={manageToolbar}
        enableDragReorder={enableDragReorder}
        onEdit={onEditItem}
        onReorder={handleReorder}
        isSaving={isSaving}
        mode="portfolio"
        context="exhibit"
        user={user}
        featuredSubmissionId={featuredSubmissionId}
        onSetFeatured={onSetFeatured}
        selectionMode={selectionMode}
        selectedIds={selectedIds}
        onToggleSelect={onToggleSelect}
      />
    </PortfolioGridFrame>
  );
}

interface PortfolioGridCollectionProps {
  items: PortfolioItem[];
  isLoggedIn: boolean;
  user?: {
    id: string;
    slug?: string | null;
    name: string | null;
    image: string | null;
  };
  onReorder: (items: PortfolioItem[]) => void;
  onRemove: (item: PortfolioItem) => Promise<void>;
}

export function PortfolioGridCollection({
  items,
  isLoggedIn,
  user,
  onReorder,
  onRemove,
}: PortfolioGridCollectionProps) {
  const router = useRouter();
  const [orderedItems, setOrderedItems] = useState<PortfolioItem[]>(items);
  const [isSaving, setIsSaving] = useState(false);
  const isReorderingRef = useRef(false);
  const lastItemsRef = useRef<PortfolioItem[]>(items);
  useEffect(() => {
    const itemsChanged =
      items.length !== lastItemsRef.current.length ||
      items.some((item, idx) => {
        const lastItem = lastItemsRef.current[idx];
        if (!lastItem) return true;
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
  const submissionIds = orderedItems.map((s) => s.id);
  const handleReorder = useCallback(
    async (newItems: PortfolioItem[]) => {
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
    },
    [items, onReorder, router],
  );
  return (
    <PortfolioGridFrame
      items={orderedItems}
      isLoggedIn={isLoggedIn}
      submissionIds={submissionIds}
    >
      <PortfolioGridContent
        items={orderedItems}
        allItems={orderedItems}
        isLoggedIn={isLoggedIn}
        isOwnProfile={true}
        manageToolbar={true}
        enableDragReorder={true}
        onReorder={handleReorder}
        isSaving={isSaving}
        mode="exhibit"
        onRemove={onRemove}
        context="collection"
        user={user}
      />
    </PortfolioGridFrame>
  );
}

interface PortfolioGridExhibitProps {
  items: PortfolioItem[];
  onReorder: (items: PortfolioItem[]) => void;
  onRemove: (item: PortfolioItem) => Promise<void>;
}

export function PortfolioGridExhibit({
  items,
  onReorder,
  onRemove,
}: PortfolioGridExhibitProps) {
  const router = useRouter();
  const [orderedItems, setOrderedItems] = useState<PortfolioItem[]>(items);
  const [isSaving, setIsSaving] = useState(false);
  const isReorderingRef = useRef(false);
  const lastItemsRef = useRef<PortfolioItem[]>(items);
  useEffect(() => {
    const itemsChanged =
      items.length !== lastItemsRef.current.length ||
      items.some((item, idx) => {
        const lastItem = lastItemsRef.current[idx];
        if (!lastItem) return true;
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
  const submissionIds = orderedItems.map((s) => s.id);
  const handleReorder = useCallback(
    async (newItems: PortfolioItem[]) => {
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
    },
    [items, onReorder, router],
  );
  return (
    <PortfolioGridFrame
      items={orderedItems}
      isLoggedIn={true}
      submissionIds={submissionIds}
    >
      <PortfolioGridContent
        items={orderedItems}
        allItems={orderedItems}
        isLoggedIn={true}
        isOwnProfile={false}
        manageToolbar={true}
        enableDragReorder={true}
        onReorder={handleReorder}
        isSaving={isSaving}
        mode="exhibit"
        onRemove={onRemove}
        context="exhibit"
      />
    </PortfolioGridFrame>
  );
}

interface SortablePortfolioItemProps {
  item: PortfolioItem;
  isLoggedIn: boolean;
  manageToolbar: boolean;
  allowDragHandle: boolean;
  isDragging?: boolean;
  isOwnProfile?: boolean;
  mode?: "portfolio" | "exhibit";
  onEdit?: (item: PortfolioItem) => void;
  onDeleteClick: (e: React.MouseEvent, item: PortfolioItem) => void;
  onClick: () => void;
  featuredSubmissionId?: string | null;
  onSetFeatured?: (item: PortfolioItem) => void | Promise<void>;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string, selected: boolean) => void;
}

function SortablePortfolioItem({
  item,
  isLoggedIn,
  manageToolbar,
  allowDragHandle,
  isDragging,
  isOwnProfile = false,
  mode = "portfolio",
  onEdit,
  onDeleteClick,
  onClick,
  featuredSubmissionId,
  onSetFeatured,
  selectionMode = false,
  isSelected = false,
  onToggleSelect,
}: SortablePortfolioItemProps) {
  const t = useTranslations("portfolio");
  const tProfile = useTranslations("profile");
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: item.id, disabled: !allowDragHandle });

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

  const isWip = item.isWorkInProgress;
  const isFeatured =
    featuredSubmissionId != null && featuredSubmissionId === item.id;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`group overflow-hidden transition-shadow duration-300 ${
        isWip
          ? "border-2 border-dashed border-muted-foreground/40 rounded-sm"
          : "border-0 rounded-none"
      } ${
        isDragging || isSortableDragging ? "ring-2 ring-ring" : ""
      } hover:shadow-[0_0_20px_4px_hsl(var(--ring)/0.3)]`}
    >
      <div
        className="protected-image-wrapper relative aspect-square cursor-pointer overflow-hidden bg-muted"
        onClick={onClick}
        onContextMenu={handleImageContextMenu}
      >
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.title || t("portfolioItemAlt")}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105 select-none"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            style={{
              objectPosition: getObjectPositionStyle(item.imageFocalPoint),
            }}
            draggable={false}
          />
        ) : item.text ? (
          <TextThumbnail text={item.text} className="h-full w-full" />
        ) : isWip && item.latestProgressionImageUrl ? (
          <Image
            src={item.latestProgressionImageUrl}
            alt={item.title || t("portfolioItemAlt")}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105 select-none opacity-70"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            draggable={false}
          />
        ) : isWip && item.latestProgressionText ? (
          <TextThumbnail
            text={item.latestProgressionText}
            className="h-full w-full opacity-70"
          />
        ) : isWip ? (
          <div className="flex h-full w-full items-center justify-center">
            <Construction className="h-10 w-10 text-muted-foreground/50" />
          </div>
        ) : null}

        {/* WIP badge */}
        {isWip && (
          <Badge
            className={cn(
              "absolute top-2 right-2 z-10 bg-amber-500/80 text-xs text-white hover:bg-amber-500/80",
              isFeatured && "right-12",
            )}
          >
            {t("wipBadge")}
          </Badge>
        )}

        {selectionMode && onToggleSelect && isOwnProfile && (
          <div
            className={cn(
              "absolute top-2 right-2 z-20",
              isFeatured && "right-12",
            )}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) =>
                onToggleSelect(item.id, checked === true)
              }
              aria-label={t("selectItem")}
            />
          </div>
        )}

        {/* Drag handle indicator in top left (only in edit mode) */}
        {allowDragHandle && (
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
            {item.title || t("untitled")}
          </h3>
          {mode === "exhibit" && item.user && (
            <p className="truncate text-xs text-white/80 mt-0.5">
              {t("by")} {item.user.name || tProfile("anonymous")}
            </p>
          )}
        </div>

        {/* Favorite button in top right */}
        {isLoggedIn && !isOwnProfile && (
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

        {manageToolbar && (
          <div
            className={cn(
              "absolute bottom-2 right-2 z-[25] flex flex-col gap-2 transition-opacity duration-200",
              "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
            )}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {mode === "portfolio" && onEdit && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className={cn("h-10 w-10 shrink-0", LIGHTBOX_BUTTON_CLASS)}
                    onClick={handleEdit}
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">{t("edit")}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("edit")}</p>
                </TooltipContent>
              </Tooltip>
            )}
            {mode === "portfolio" && onSetFeatured && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className={cn(
                      "h-10 w-10 shrink-0",
                      LIGHTBOX_BUTTON_CLASS,
                      featuredSubmissionId === item.id &&
                        "!border-amber-300/50 !bg-amber-500/35 !text-white hover:!bg-amber-500/50",
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSetFeatured(item);
                    }}
                  >
                    <Star
                      className={cn(
                        "h-4 w-4",
                        featuredSubmissionId === item.id && "fill-current",
                      )}
                    />
                    <span className="sr-only">{t("setAsFeatured")}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {featuredSubmissionId === item.id
                      ? t("removeFromFeatured")
                      : t("setAsFeatured")}
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className={cn(
                    "h-10 w-10 shrink-0",
                    LIGHTBOX_BUTTON_CLASS,
                    "hover:!border-red-300/50 hover:!bg-red-500/30 hover:!text-white",
                  )}
                  onClick={(e) => onDeleteClick(e, item)}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">
                    {mode === "exhibit" ? t("remove") : t("delete")}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{mode === "exhibit" ? t("remove") : t("delete")}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {isFeatured && <PortfolioFeaturedDogear />}
      </div>
    </Card>
  );
}

function PortfolioGridContent({
  items,
  allItems,
  isLoggedIn,
  isOwnProfile,
  manageToolbar,
  enableDragReorder,
  onEdit,
  onDelete,
  onReorder,
  isSaving,
  mode,
  onRemove,
  context,
  user,
  featuredSubmissionId,
  onSetFeatured,
  selectionMode = false,
  selectedIds,
  onToggleSelect,
}: {
  items: PortfolioItem[];
  allItems: PortfolioItem[];
  isLoggedIn: boolean;
  isOwnProfile: boolean;
  manageToolbar: boolean;
  enableDragReorder: boolean;
  onEdit?: (item: PortfolioItem) => void;
  onDelete?: (item: PortfolioItem) => Promise<void>;
  onReorder: (items: PortfolioItem[]) => void;
  isSaving: boolean;
  mode?: "portfolio" | "exhibit";
  onRemove?: (item: PortfolioItem) => Promise<void>;
  context?: "exhibit" | "collection";
  user?: {
    id: string;
    slug?: string | null;
    name: string | null;
    image: string | null;
  };
  featuredSubmissionId?: string | null;
  onSetFeatured?: (item: PortfolioItem) => void | Promise<void>;
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string, selected: boolean) => void;
}) {
  const router = useRouter();
  const t = useTranslations("portfolio");
  const [deletingItem, setDeletingItem] = useState<PortfolioItem | null>(null);
  const [removingItem, setRemovingItem] = useState<PortfolioItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] =
    useState<PortfolioItem | null>(null);

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

  const isDndEnabled =
    enableDragReorder ||
    (mode === "portfolio" && isOwnProfile && manageToolbar);

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
                  manageToolbar={manageToolbar}
                  allowDragHandle={enableDragReorder}
                  isDragging={activeId === item.id}
                  isOwnProfile={isOwnProfile}
                  mode={mode}
                  onEdit={onEdit}
                  onDeleteClick={handleDeleteClick}
                  selectionMode={selectionMode}
                  isSelected={selectedIds?.has(item.id)}
                  onToggleSelect={onToggleSelect}
                  onClick={() => {
                    if (item.imageUrl) {
                      setSelectedSubmission(item);
                    } else {
                      const creator = item.user || user;
                      if (creator) {
                        router.push(`${getCreatorUrl(creator)}/s/${item.id}`);
                      }
                      // Note: If creator is missing, we can't navigate - this shouldn't happen
                    }
                  }}
                  featuredSubmissionId={featuredSubmissionId}
                  onSetFeatured={onSetFeatured}
                />
              ) : (
                <div>
                  <Card
                    className={`group relative overflow-hidden transition-shadow duration-300 hover:shadow-[0_0_20px_4px_hsl(var(--ring)/0.3)] ${
                      item.isWorkInProgress
                        ? "border-2 border-dashed border-muted-foreground/40 rounded-sm"
                        : "border-0 rounded-none"
                    }`}
                  >
                    <div
                      className="protected-image-wrapper relative aspect-square cursor-pointer overflow-hidden bg-muted"
                      onClick={() => {
                        if (item.imageUrl) {
                          setSelectedSubmission(item);
                        } else {
                          const creator = item.user || user;
                          if (creator) {
                            router.push(
                              `${getCreatorUrl(creator)}/s/${item.id}`,
                            );
                          }
                        }
                      }}
                      onContextMenu={handleImageContextMenu}
                    >
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.title || t("portfolioItemAlt")}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105 select-none"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          style={{
                            objectPosition: getObjectPositionStyle(
                              item.imageFocalPoint,
                            ),
                          }}
                          draggable={false}
                        />
                      ) : item.text ? (
                        <TextThumbnail
                          text={item.text}
                          className="h-full w-full"
                        />
                      ) : item.isWorkInProgress &&
                        item.latestProgressionImageUrl ? (
                        <Image
                          src={item.latestProgressionImageUrl}
                          alt={item.title || t("portfolioItemAlt")}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105 select-none opacity-70"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          draggable={false}
                        />
                      ) : item.isWorkInProgress &&
                        item.latestProgressionText ? (
                        <TextThumbnail
                          text={item.latestProgressionText}
                          className="h-full w-full opacity-70"
                        />
                      ) : item.isWorkInProgress ? (
                        <div className="flex h-full w-full items-center justify-center">
                          <Construction className="h-10 w-10 text-muted-foreground/50" />
                        </div>
                      ) : null}

                      {/* WIP badge */}
                      {item.isWorkInProgress && (
                        <Badge
                          className={cn(
                            "absolute top-2 right-2 z-10 bg-amber-500/80 text-xs text-white hover:bg-amber-500/80",
                            isFeatured && "right-12",
                          )}
                        >
                          {t("wipBadge")}
                        </Badge>
                      )}

                      {/* Overlay information in lower left */}
                      <div className="absolute bottom-0 left-0 max-w-[85%] bg-black/70 p-2.5 pr-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <h3 className="truncate text-sm font-medium text-white drop-shadow-sm">
                          {item.title || t("untitled")}
                        </h3>
                      </div>

                      {/* Favorite button in top right */}
                      {isLoggedIn && !isOwnProfile && (
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

                      {isFeatured && <PortfolioFeaturedDogear />}
                    </div>
                  </Card>
                </div>
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
        {/* Drag/Saving hint when in edit mode */}
        {enableDragReorder && items.length > 1 && (
          <p className="mb-4 text-xs text-muted-foreground">
            {isSaving ? t("savingOrder") : t("dragToReorder")}
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
              {isOwnProfile ? t("emptyOwnProfile") : t("emptyOtherProfile")}
            </p>
            {isOwnProfile && user && (
              <Link
                href={`${getCreatorUrl(user)}/portfolio`}
                className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {t("addPortfolioItem")}
              </Link>
            )}
          </motion.div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingItem && (
          <ConfirmModal
            isOpen={true}
            title={t("deleteTitle")}
            message={t("deleteMessage", {
              title: deletingItem.title || "this item",
            })}
            confirmLabel={t("delete")}
            onConfirm={handleDeleteConfirm}
            onCancel={() => setDeletingItem(null)}
            isLoading={isDeleting}
          />
        )}

        {/* Remove Confirmation Modal */}
        {removingItem && (
          <ConfirmModal
            isOpen={true}
            title={
              context === "collection"
                ? t("removeFromCollectionTitle")
                : t("removeFromExhibitTitle")
            }
            message={
              context === "collection"
                ? t("removeFromCollectionMessage", {
                    title: removingItem.title || "this item",
                  })
                : t("removeFromExhibitMessage", {
                    title: removingItem.title || "this item",
                  })
            }
            confirmLabel={t("remove")}
            onConfirm={handleRemoveConfirm}
            onCancel={() => setRemovingItem(null)}
            isLoading={isRemoving}
          />
        )}

        {/* Lightbox */}
        {selectedSubmission &&
          (() => {
            const currentIndex = items.findIndex(
              (i) => i.id === selectedSubmission.id,
            );
            const hasPrevious = currentIndex > 0;
            const hasNext =
              currentIndex >= 0 && currentIndex < items.length - 1;
            return (
              <SubmissionLightbox
                submission={{
                  id: selectedSubmission.id,
                  title: selectedSubmission.title,
                  imageUrl: selectedSubmission.imageUrl,
                  text: selectedSubmission.text,
                  shareStatus: selectedSubmission.shareStatus ?? "PUBLIC",
                  critiquesEnabled:
                    selectedSubmission.critiquesEnabled ?? false,
                  user:
                    mode === "exhibit" && selectedSubmission.user
                      ? selectedSubmission.user
                      : user,
                  _count: selectedSubmission._count,
                }}
                onClose={() => setSelectedSubmission(null)}
                isOpen={!!selectedSubmission}
                navigation={{
                  onGoToPrevious: () => {
                    if (hasPrevious)
                      setSelectedSubmission(items[currentIndex - 1]);
                  },
                  onGoToNext: () => {
                    if (hasNext) setSelectedSubmission(items[currentIndex + 1]);
                  },
                  hasPrevious,
                  hasNext,
                  nextImageUrl: hasNext
                    ? (items[currentIndex + 1]?.imageUrl ?? null)
                    : null,
                  prevImageUrl: hasPrevious
                    ? (items[currentIndex - 1]?.imageUrl ?? null)
                    : null,
                }}
              />
            );
          })()}
      </div>
    </TooltipProvider>
  );
}
