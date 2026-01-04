"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RichTextEditor } from "@/components/rich-text-editor";
import { TextThumbnail } from "@/components/text-thumbnail";
import { PortfolioItemForm } from "@/components/portfolio-item-form";
import { ConfirmModal } from "@/components/confirm-modal";

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
}

interface PortfolioItem {
  id: string;
  title: string | null;
  imageUrl: string | null;
  text: string | null;
  tags: string[];
  category: string | null;
  promptId: string | null;
}

interface ProfileEditFormProps {
  userId: string;
  initialBio: string;
  initialInstagram: string;
  initialTwitter: string;
  initialLinkedin: string;
  initialWebsite: string;
  initialFeaturedSubmissionId: string;
  submissions: SubmissionOption[];
  portfolioItems: PortfolioItem[];
}

type Tab = "profile" | "portfolio";

export function ProfileEditForm({
  userId: _userId,
  initialBio,
  initialInstagram,
  initialTwitter,
  initialLinkedin,
  initialWebsite,
  initialFeaturedSubmissionId,
  submissions,
  portfolioItems: initialPortfolioItems,
}: ProfileEditFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [bio, setBio] = useState(initialBio);
  const [instagram, setInstagram] = useState(initialInstagram);
  const [twitter, setTwitter] = useState(initialTwitter);
  const [linkedin, setLinkedin] = useState(initialLinkedin);
  const [website, setWebsite] = useState(initialWebsite);
  const [featuredSubmissionId, setFeaturedSubmissionId] = useState(
    initialFeaturedSubmissionId
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Portfolio state
  const [portfolioItems, setPortfolioItems] =
    useState<PortfolioItem[]>(initialPortfolioItems);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<PortfolioItem | null>(null);

  // Check for hash to auto-switch to portfolio tab
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#portfolio") {
      setActiveTab("portfolio");
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: bio || null,
          instagram: instagram || null,
          twitter: twitter || null,
          linkedin: linkedin || null,
          website: website || null,
          featuredSubmissionId: featuredSubmissionId || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save profile");
      }

      router.push(`/profile/${(await response.json()).user.id}`);
      router.refresh();
    } catch {
      setError("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePortfolioItem = async (item: PortfolioItem) => {
    try {
      const response = await fetch(`/api/submissions/${item.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete");
      }

      setPortfolioItems((prev) => prev.filter((p) => p.id !== item.id));
      setDeletingItem(null);
    } catch {
      setError("Failed to delete portfolio item. Please try again.");
    }
  };

  const handleTogglePortfolio = async (
    submission: SubmissionOption,
    addToPortfolio: boolean
  ) => {
    try {
      const response = await fetch(`/api/submissions/${submission.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isPortfolio: addToPortfolio,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update");
      }

      if (addToPortfolio) {
        setPortfolioItems((prev) => [
          ...prev,
          {
            id: submission.id,
            title: submission.title,
            imageUrl: submission.imageUrl,
            text: submission.text,
            tags: submission.tags,
            category: submission.category,
            promptId: null,
          },
        ]);
      } else {
        setPortfolioItems((prev) => prev.filter((p) => p.id !== submission.id));
      }

      router.refresh();
    } catch {
      setError("Failed to update portfolio. Please try again.");
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
      {/* Tabs */}
      <div className="mb-6 border-b border-zinc-200 dark:border-zinc-800">
        <nav className="-mb-px flex gap-6">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
              activeTab === "profile"
                ? "border-zinc-900 text-zinc-900 dark:border-white dark:text-white"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
            }`}
          >
            Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("portfolio")}
            className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
              activeTab === "portfolio"
                ? "border-zinc-900 text-zinc-900 dark:border-white dark:text-white"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
            }`}
          >
            Portfolio
            {portfolioItems.length > 0 && (
              <span className="ml-2 rounded-full bg-zinc-200 px-2 py-0.5 text-xs dark:bg-zinc-700">
                {portfolioItems.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-900 dark:text-white">
              Bio
            </label>
            <RichTextEditor
              value={bio}
              onChange={setBio}
              placeholder="Tell us about yourself..."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-900 dark:text-white">
              Featured Piece
            </label>
            <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
              Select a work to feature on your profile
            </p>
            {submissions.length > 0 ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex w-full items-center justify-between rounded-lg border border-zinc-300 bg-white px-4 py-3 text-left transition-colors focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:focus:border-zinc-500"
                  aria-expanded={isDropdownOpen}
                  aria-haspopup="listbox"
                >
                  {(() => {
                    const selected = submissions.find(
                      (s) => s.id === featuredSubmissionId
                    );
                    if (!selected) {
                      return (
                        <span className="text-zinc-500 dark:text-zinc-400">
                          None
                        </span>
                      );
                    }
                    const word = getSubmissionLabel(selected);
                    return (
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        {selected.imageUrl ? (
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={selected.imageUrl}
                              alt={selected.title || word}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : selected.text ? (
                          <TextThumbnail
                            text={selected.text}
                            className="h-10 w-10 shrink-0 rounded-lg"
                          />
                        ) : (
                          <div className="h-10 w-10 shrink-0 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                              {word}
                            </span>
                          </div>
                          {selected.title && (
                            <p className="truncate text-sm font-medium text-zinc-900 dark:text-white">
                              {selected.title}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                  <svg
                    className={`h-5 w-5 shrink-0 text-zinc-500 transition-transform dark:text-zinc-400 ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {isDropdownOpen && (
                  <div className="absolute z-50 mt-2 max-h-96 w-full overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setFeaturedSubmissionId("");
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-3 text-left transition-colors ${
                          featuredSubmissionId === ""
                            ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-700 dark:text-white"
                            : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
                        }`}
                      >
                        <span className="text-sm font-medium">None</span>
                      </button>
                      {submissions.map((submission) => {
                        const word = getSubmissionLabel(submission);
                        const isSelected =
                          featuredSubmissionId === submission.id;
                        return (
                          <button
                            key={submission.id}
                            type="button"
                            onClick={() => {
                              setFeaturedSubmissionId(submission.id);
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full px-4 py-3 text-left transition-colors ${
                              isSelected
                                ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-700 dark:text-white"
                                : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {submission.imageUrl ? (
                                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={submission.imageUrl}
                                    alt={submission.title || word}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              ) : submission.text ? (
                                <TextThumbnail
                                  text={submission.text}
                                  className="h-12 w-12 shrink-0 rounded-lg"
                                />
                              ) : (
                                <div className="h-12 w-12 shrink-0 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                    {word}
                                  </span>
                                  {submission.isPortfolio && (
                                    <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-xs text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                      Portfolio
                                    </span>
                                  )}
                                  {isSelected && (
                                    <span className="text-xs text-zinc-600 dark:text-zinc-400">
                                      (Featured)
                                    </span>
                                  )}
                                </div>
                                {submission.title && (
                                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-white">
                                    {submission.title}
                                  </p>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No work yet. Create a submission or add to your portfolio to
                feature it.
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="instagram"
                className="mb-2 block text-sm font-medium text-zinc-900 dark:text-white"
              >
                Instagram
              </label>
              <div className="flex">
                <span className="inline-flex items-center rounded-l-lg border border-r-0 border-zinc-300 bg-zinc-50 px-3 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                  @
                </span>
                <input
                  type="text"
                  id="instagram"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="username"
                  className="block w-full rounded-r-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-zinc-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="twitter"
                className="mb-2 block text-sm font-medium text-zinc-900 dark:text-white"
              >
                X (Twitter)
              </label>
              <div className="flex">
                <span className="inline-flex items-center rounded-l-lg border border-r-0 border-zinc-300 bg-zinc-50 px-3 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                  @
                </span>
                <input
                  type="text"
                  id="twitter"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="username"
                  className="block w-full rounded-r-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-zinc-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="linkedin"
                className="mb-2 block text-sm font-medium text-zinc-900 dark:text-white"
              >
                LinkedIn
              </label>
              <div className="flex">
                <span className="inline-flex items-center rounded-l-lg border border-r-0 border-zinc-300 bg-zinc-50 px-3 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                  in/
                </span>
                <input
                  type="text"
                  id="linkedin"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="username"
                  className="block w-full rounded-r-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-zinc-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="website"
                className="mb-2 block text-sm font-medium text-zinc-900 dark:text-white"
              >
                Website
              </label>
              <input
                type="url"
                id="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.com"
                className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-zinc-500"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Portfolio Tab */}
      {activeTab === "portfolio" && (
        <div className="space-y-6">
          {/* Add New Portfolio Item */}
          {showAddForm ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
                Add Portfolio Item
              </h3>
              <PortfolioItemForm
                mode="create"
                onSuccess={() => {
                  setShowAddForm(false);
                  router.refresh();
                }}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          ) : editingItem ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
                Edit Portfolio Item
              </h3>
              <PortfolioItemForm
                mode="edit"
                initialData={editingItem}
                onSuccess={() => {
                  setEditingItem(null);
                  router.refresh();
                }}
                onCancel={() => setEditingItem(null)}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 py-8 text-sm font-medium text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-300"
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
            </button>
          )}

          {/* Portfolio Items List */}
          {portfolioItems.length > 0 && !showAddForm && !editingItem && (
            <div>
              <h3 className="mb-4 text-sm font-medium text-zinc-900 dark:text-white">
                Your Portfolio Items ({portfolioItems.length})
              </h3>
              <div className="space-y-3">
                {portfolioItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    {item.imageUrl ? (
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl}
                          alt={item.title || "Portfolio item"}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : item.text ? (
                      <TextThumbnail
                        text={item.text}
                        className="h-16 w-16 shrink-0 rounded-lg"
                      />
                    ) : (
                      <div className="h-16 w-16 shrink-0 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-zinc-900 dark:text-white">
                        {item.title || "Untitled"}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        {item.category && (
                          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                            {item.category}
                          </span>
                        )}
                        {item.promptId && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            Prompt Submission
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingItem(item)}
                        className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                      >
                        <svg
                          className="h-4 w-4"
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
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingItem(item)}
                        className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                      >
                        <svg
                          className="h-4 w-4"
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
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add from Prompt Submissions */}
          {submissions.filter((s) => !s.isPortfolio && s.prompt).length > 0 &&
            !showAddForm &&
            !editingItem && (
              <div>
                <h3 className="mb-4 text-sm font-medium text-zinc-900 dark:text-white">
                  Add Prompt Submissions to Portfolio
                </h3>
                <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">
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
                          className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
                        >
                          {submission.imageUrl ? (
                            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={submission.imageUrl}
                                alt={submission.title || word}
                                className="h-full w-full object-cover"
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
                            <p className="truncate text-sm font-medium text-zinc-900 dark:text-white">
                              {submission.title || word}
                            </p>
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                              {word}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleTogglePortfolio(submission, true)
                            }
                            className="shrink-0 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                          >
                            Add to Portfolio
                          </button>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <ConfirmModal
          isOpen={true}
          title="Delete Portfolio Item"
          message={`Are you sure you want to delete "${deletingItem.title || "this item"}" from your portfolio? This action cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={() => handleDeletePortfolioItem(deletingItem)}
          onCancel={() => setDeletingItem(null)}
        />
      )}
    </div>
  );
}
