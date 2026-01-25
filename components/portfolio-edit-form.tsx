"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { TextThumbnail } from "@/components/text-thumbnail";
import { PortfolioListEditor } from "@/components/portfolio-list-editor";
import { SubmissionEditModal } from "@/components/submission-edit-modal";
import { Button } from "@/components/ui/button";
import { getObjectPositionStyle } from "@/lib/image-utils";

interface SubmissionOption {
  id: string;
  title: string | null;
  imageUrl: string | null;
  imageFocalPoint?: { x: number; y: number } | null;
  text: string | null;
  wordIndex: number | null;
  isPortfolio: boolean;
  tags: string[];
  category: string | null;
  prompt: {
    word1: string;
    word2: string;
    word3: string;
  } | null;
  shareStatus?: "PRIVATE" | "PROFILE" | "PUBLIC";
}

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

interface PortfolioEditFormProps {
  submissions: SubmissionOption[];
  portfolioItems: PortfolioItem[];
  featuredSubmissionId?: string | null;
  totalPortfolioCount: number;
}

export function PortfolioEditForm({
  submissions,
  portfolioItems: initialPortfolioItems,
  featuredSubmissionId: initialFeaturedSubmissionId,
  totalPortfolioCount,
}: PortfolioEditFormProps) {
  const router = useRouter();
  const t = useTranslations("portfolio");
  const tProfile = useTranslations("profile");
  const [error, setError] = useState<string | null>(null);

  // Portfolio state
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>(
    initialPortfolioItems,
  );
  const [featuredSubmissionId, setFeaturedSubmissionId] = useState<
    string | null
  >(initialFeaturedSubmissionId ?? null);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [addingToPortfolio, setAddingToPortfolio] =
    useState<SubmissionOption | null>(null);
  const [creatingPortfolioItem, setCreatingPortfolioItem] = useState(false);

  // Pagination state
  const [hasMore, setHasMore] = useState(
    initialPortfolioItems.length < totalPortfolioCount,
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Sync portfolio items state when initialPortfolioItems prop changes (e.g., after router.refresh())
  useEffect(() => {
    setPortfolioItems(initialPortfolioItems);
    setHasMore(initialPortfolioItems.length < totalPortfolioCount);
  }, [initialPortfolioItems, totalPortfolioCount]);

  const handleDeletePortfolioItem = async (item: PortfolioItem) => {
    try {
      const response = await fetch(`/api/submissions/${item.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete");
      }

      setPortfolioItems((prev) => prev.filter((p) => p.id !== item.id));
      router.refresh();
    } catch {
      setError(t("deleteError"));
    }
  };

  const handleEditPortfolioItem = (item: PortfolioItem) => {
    setEditingItem(item);
  };

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      const response = await fetch(
        `/api/portfolio/items?skip=${portfolioItems.length}&take=50`,
      );

      if (!response.ok) {
        throw new Error("Failed to load more items");
      }

      const data = await response.json();
      setPortfolioItems((prev) => [...prev, ...data.items]);
      setHasMore(data.hasMore);
    } catch (err) {
      console.error("Failed to load more items:", err);
      setError(t("loadMoreError"));
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, portfolioItems.length, t]);

  const handleReorder = useCallback(async (newItems: PortfolioItem[]) => {
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
  }, []);

  const handleBulkDelete = useCallback(
    async (ids: string[]) => {
      const deletePromises = ids.map((id) =>
        fetch(`/api/submissions/${id}`, { method: "DELETE" }),
      );

      const results = await Promise.all(deletePromises);
      const failedCount = results.filter((r) => !r.ok).length;

      if (failedCount > 0) {
        setError(t("bulkDeletePartialError", { count: failedCount }));
      }

      router.refresh();
    },
    [router, t],
  );

  const handleSetFeatured = async (item: PortfolioItem) => {
    try {
      // If the item is already featured, remove it (set to null)
      // Otherwise, set it as featured
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
    } catch {
      setError(t("setFeaturedError"));
    }
  };

  const getSubmissionLabel = (submission: SubmissionOption): string => {
    if (submission.prompt && submission.wordIndex) {
      return [
        submission.prompt.word1,
        submission.prompt.word2,
        submission.prompt.word3,
      ][submission.wordIndex - 1];
    }
    return submission.category || tProfile("portfolio");
  };

  return (
    <div>
      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Add New Portfolio Item */}
        <Button
          type="button"
          variant="outline"
          onClick={() => setCreatingPortfolioItem(true)}
          className="w-full border-2 border-dashed py-8"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          {t("addNewItem")}
        </Button>

        {/* Portfolio Items List */}
        {portfolioItems.length > 0 && (
          <PortfolioListEditor
            items={portfolioItems}
            totalCount={totalPortfolioCount}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            onLoadMore={handleLoadMore}
            onEdit={handleEditPortfolioItem}
            onDelete={handleDeletePortfolioItem}
            onReorder={handleReorder}
            featuredSubmissionId={featuredSubmissionId}
            onSetFeatured={handleSetFeatured}
            onBulkDelete={handleBulkDelete}
          />
        )}

        {/* Add from Prompt Submissions */}
        {submissions.filter((s) => !s.isPortfolio && s.prompt).length > 0 && (
          <div>
            <h3 className="mb-4 text-sm font-medium text-foreground">
              {t("addPromptSubmissions")}
            </h3>
            <p className="mb-4 text-xs text-muted-foreground">
              {t("addPromptSubmissionsDescription")}
            </p>
            <div className="space-y-2">
              {submissions
                .filter((s) => !s.isPortfolio && s.prompt)
                .slice(0, 5)
                .map((submission) => {
                  const word = getSubmissionLabel(submission);
                  return (
                    <div
                      key={submission.id}
                      className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
                    >
                      {submission.imageUrl ? (
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                          <Image
                            src={submission.imageUrl}
                            alt={submission.title || word}
                            fill
                            className="object-cover"
                            sizes="40px"
                            style={{
                              objectPosition: getObjectPositionStyle(
                                submission.imageFocalPoint,
                              ),
                            }}
                          />
                        </div>
                      ) : submission.text ? (
                        <TextThumbnail
                          text={submission.text}
                          className="h-10 w-10 shrink-0 rounded-lg"
                        />
                      ) : (
                        <div className="h-10 w-10 shrink-0 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {submission.title || word}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {word}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setAddingToPortfolio(submission)}
                        className="shrink-0"
                      >
                        {t("addToPortfolio")}
                      </Button>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {portfolioItems.length === 0 &&
          submissions.filter((s) => !s.isPortfolio && s.prompt).length ===
            0 && (
            <div className="rounded-lg border border-dashed border-border py-12 text-center">
              <p className="text-muted-foreground">{t("emptyState")}</p>
            </div>
          )}
      </div>

      {/* Edit Modal */}
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
          onSuccess={(updatedData) => {
            // Update the local portfolio items state with the new data
            if (updatedData) {
              setPortfolioItems((prev) =>
                prev.map((item) =>
                  item.id === updatedData.id
                    ? {
                        ...item,
                        title: updatedData.title,
                        imageUrl: updatedData.imageUrl,
                        imageFocalPoint: updatedData.imageFocalPoint,
                        text: updatedData.text,
                        tags: updatedData.tags,
                        category: updatedData.category,
                        shareStatus: updatedData.shareStatus,
                      }
                    : item,
                ),
              );
            }
            setEditingItem(null);
          }}
        />
      )}

      {/* Create New Portfolio Item Modal */}
      {creatingPortfolioItem && (
        <SubmissionEditModal
          isOpen={true}
          onClose={() => setCreatingPortfolioItem(false)}
          mode="create"
          onSuccess={() => {
            setCreatingPortfolioItem(false);
          }}
        />
      )}

      {/* Add to Portfolio Modal */}
      {addingToPortfolio && (
        <SubmissionEditModal
          isOpen={true}
          onClose={() => setAddingToPortfolio(null)}
          mode="add-to-portfolio"
          initialData={{
            id: addingToPortfolio.id,
            title: addingToPortfolio.title,
            imageUrl: addingToPortfolio.imageUrl,
            imageFocalPoint: addingToPortfolio.imageFocalPoint,
            text: addingToPortfolio.text,
            tags: addingToPortfolio.tags,
            category: addingToPortfolio.category,
            shareStatus: addingToPortfolio.shareStatus || "PUBLIC",
          }}
          onSuccess={(updatedData) => {
            // Add the submission to portfolio items state
            if (updatedData && addingToPortfolio) {
              setPortfolioItems((prev) => [
                ...prev,
                {
                  id: updatedData.id,
                  title: updatedData.title,
                  imageUrl: updatedData.imageUrl,
                  imageFocalPoint: updatedData.imageFocalPoint,
                  text: updatedData.text,
                  isPortfolio: true,
                  portfolioOrder: null,
                  tags: updatedData.tags,
                  category: updatedData.category,
                  promptId: null,
                  wordIndex: addingToPortfolio.wordIndex,
                  prompt: addingToPortfolio.prompt,
                  _count: { favorites: 0, views: 0 },
                  shareStatus: updatedData.shareStatus,
                },
              ]);
            }
            setAddingToPortfolio(null);
          }}
        />
      )}
    </div>
  );
}
