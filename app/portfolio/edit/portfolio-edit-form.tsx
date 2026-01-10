"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { TextThumbnail } from "@/components/text-thumbnail";
import { PortfolioGrid } from "@/components/portfolio-grid";
import { SubmissionEditModal } from "@/components/submission-edit-modal";
import { Button } from "@/components/ui/button";

interface SubmissionOption {
  id: string;
  title: string | null;
  imageUrl: string | null;
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

interface PortfolioEditFormProps {
  submissions: SubmissionOption[];
  portfolioItems: PortfolioItem[];
  featuredSubmissionId?: string | null;
}

export function PortfolioEditForm({
  submissions,
  portfolioItems: initialPortfolioItems,
  featuredSubmissionId: initialFeaturedSubmissionId,
}: PortfolioEditFormProps) {
  const router = useRouter();
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

  // Sync portfolio items state when initialPortfolioItems prop changes (e.g., after router.refresh())
  useEffect(() => {
    setPortfolioItems(initialPortfolioItems);
  }, [initialPortfolioItems]);

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
      setError("Failed to delete portfolio item. Please try again.");
    }
  };

  const handleEditPortfolioItem = (item: PortfolioItem) => {
    setEditingItem(item);
  };

  const handleDeletePortfolioItemFromGrid = async (item: PortfolioItem) => {
    await handleDeletePortfolioItem(item);
  };

  const handleSetFeatured = async (item: PortfolioItem) => {
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          featuredSubmissionId: item.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to set featured submission");
      }

      setFeaturedSubmissionId(item.id);
      router.refresh();
    } catch {
      setError("Failed to set featured submission. Please try again.");
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
    return submission.category || "Portfolio";
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
          Add New Portfolio Item
        </Button>

        {/* Portfolio Items Grid */}
        {portfolioItems.length > 0 && (
          <div>
            <h3 className="mb-4 text-sm font-medium text-foreground">
              Your Portfolio Items ({portfolioItems.length})
            </h3>
            <PortfolioGrid
              items={portfolioItems}
              isLoggedIn={true}
              isOwnProfile={true}
              showPromptBadge={true}
              allowEdit={true}
              onEdit={handleEditPortfolioItem}
              onDelete={handleDeletePortfolioItemFromGrid}
              featuredSubmissionId={featuredSubmissionId}
              onSetFeatured={handleSetFeatured}
            />
          </div>
        )}

        {/* Add from Prompt Submissions */}
        {submissions.filter((s) => !s.isPortfolio && s.prompt).length > 0 && (
          <div>
            <h3 className="mb-4 text-sm font-medium text-foreground">
              Add Prompt Submissions to Portfolio
            </h3>
            <p className="mb-4 text-xs text-muted-foreground">
              Your prompt submissions can also be added to your portfolio
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
                        Add to Portfolio
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
              <p className="text-muted-foreground">
                No portfolio items yet. Click the button above to add your first
                portfolio item.
              </p>
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
                  text: updatedData.text,
                  isPortfolio: true,
                  portfolioOrder: null,
                  tags: updatedData.tags,
                  category: updatedData.category,
                  promptId: null,
                  wordIndex: addingToPortfolio.wordIndex,
                  prompt: addingToPortfolio.prompt,
                  _count: { favorites: 0 },
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
