"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RichTextEditor } from "@/components/rich-text-editor";
import { TextThumbnail } from "@/components/text-thumbnail";

interface SubmissionOption {
  id: string;
  title: string | null;
  imageUrl: string | null;
  text: string | null;
  wordIndex: number;
  prompt: {
    word1: string;
    word2: string;
    word3: string;
  };
}

interface ProfileEditFormProps {
  initialBio: string;
  initialInstagram: string;
  initialTwitter: string;
  initialLinkedin: string;
  initialWebsite: string;
  initialFeaturedSubmissionId: string;
  submissions: SubmissionOption[];
}

export function ProfileEditForm({
  initialBio,
  initialInstagram,
  initialTwitter,
  initialLinkedin,
  initialWebsite,
  initialFeaturedSubmissionId,
  submissions,
}: ProfileEditFormProps) {
  const router = useRouter();
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

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
          Select a submission to feature on your profile
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
                const word = [
                  selected.prompt.word1,
                  selected.prompt.word2,
                  selected.prompt.word3,
                ][selected.wordIndex - 1];
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
                    const word = [
                      submission.prompt.word1,
                      submission.prompt.word2,
                      submission.prompt.word3,
                    ][submission.wordIndex - 1];
                    const isSelected = featuredSubmissionId === submission.id;
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
            No submissions yet. Create a submission to feature it on your
            profile.
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
  );
}
