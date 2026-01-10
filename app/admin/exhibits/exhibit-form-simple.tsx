"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RichTextEditor } from "@/components/rich-text-editor";
import { FeaturedSubmissionSelector } from "@/components/featured-submission-selector";
import { UserSelector } from "@/components/user-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

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

interface UserOption {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface Exhibit {
  id: string;
  title: string;
  description: string | null;
  startTime: Date;
  endTime: Date;
  isActive: boolean;
  curatorId: string;
  featuredArtistId: string | null;
  featuredSubmissionId: string | null;
  allowedViewTypes: string[];
}

interface ExhibitFormSimpleProps {
  exhibit?: Exhibit;
  users: UserOption[];
  submissions: SubmissionOption[];
  mode: "create" | "edit";
  exhibitId?: string;
}

export function ExhibitFormSimple({
  exhibit,
  users,
  submissions,
  mode,
  exhibitId,
}: ExhibitFormSimpleProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(exhibit?.title || "");
  const [description, setDescription] = useState(exhibit?.description || "");
  const [startTime, setStartTime] = useState(
    exhibit
      ? new Date(exhibit.startTime).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
  );
  const [endTime, setEndTime] = useState(
    exhibit
      ? new Date(exhibit.endTime).toISOString().slice(0, 16)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 16),
  );
  const [isActive, setIsActive] = useState(exhibit?.isActive ?? true);
  const [curatorId, setCuratorId] = useState(exhibit?.curatorId || "");
  const [featuredArtistId, setFeaturedArtistId] = useState(
    exhibit?.featuredArtistId || "",
  );
  const [allowedViewTypes, setAllowedViewTypes] = useState<string[]>(
    exhibit?.allowedViewTypes || ["gallery", "constellation", "global"],
  );
  const [featuredSubmissionId, setFeaturedSubmissionId] = useState(
    exhibit?.featuredSubmissionId || "",
  );

  const [usersLoading, setUsersLoading] = useState(false);
  const [usersList, setUsersList] = useState<UserOption[]>(users);

  useEffect(() => {
    setUsersList(users);
  }, [users]);

  const handleViewTypeToggle = useCallback((viewType: string) => {
    setAllowedViewTypes((prev) => {
      if (prev.includes(viewType)) {
        if (prev.length === 1) {
          return prev;
        }
        return prev.filter((v) => v !== viewType);
      }
      return [...prev, viewType];
    });
  }, []);

  const handleUserSearch = useCallback(
    async (query: string) => {
      if (!query) {
        setUsersList(users);
        return;
      }

      setUsersLoading(true);
      try {
        const response = await fetch(
          `/api/users?q=${encodeURIComponent(query)}`,
        );
        if (response.ok) {
          const data = await response.json();
          setUsersList(data.users || []);
        }
      } catch {
        // Ignore errors
      } finally {
        setUsersLoading(false);
      }
    },
    [users],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (!title.trim()) {
        setError("Title is required");
        return;
      }

      if (!startTime || !endTime) {
        setError("Start time and end time are required");
        return;
      }

      if (new Date(startTime) >= new Date(endTime)) {
        setError("End time must be after start time");
        return;
      }

      if (!curatorId) {
        setError("Curator is required");
        return;
      }

      if (allowedViewTypes.length === 0) {
        setError("At least one view type must be selected");
        return;
      }

      setIsLoading(true);

      try {
        const body: any = {
          title: title.trim(),
          description: description.trim() || null,
          startTime,
          endTime,
          isActive,
          curatorId,
          allowedViewTypes,
          featuredArtistId: featuredArtistId || null,
          featuredSubmissionId: featuredSubmissionId || null,
        };

        const url =
          mode === "edit" && exhibitId
            ? `/api/exhibits/${exhibitId}`
            : "/api/exhibits";
        const method = mode === "edit" ? "PUT" : "POST";

        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to save exhibit");
        }

        router.push("/admin/exhibits");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save exhibit");
      } finally {
        setIsLoading(false);
      }
    },
    [
      title,
      description,
      startTime,
      endTime,
      isActive,
      curatorId,
      featuredArtistId,
      allowedViewTypes,
      featuredSubmissionId,
      mode,
      exhibitId,
      router,
    ],
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div>
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Exhibit title"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <RichTextEditor
          value={description}
          onChange={setDescription}
          placeholder="Exhibit description (markdown supported)"
        />
      </div>

      {mode === "edit" && exhibitId && (
        <div>
          <Link href={`/admin/exhibits/${exhibitId}/content`}>
            <Button type="button" variant="outline" className="w-full">
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
                />
              </svg>
              Manage Content
            </Button>
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="startTime">Start Time *</Label>
          <Input
            id="startTime"
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="endTime">End Time *</Label>
          <Input
            id="endTime"
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isActive"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4 w-4 rounded border-input"
        />
        <Label htmlFor="isActive" className="cursor-pointer">
          Active (exhibit will be visible if within time range)
        </Label>
      </div>

      <UserSelector
        users={usersList}
        selectedUserId={curatorId}
        onChange={setCuratorId}
        label="Curator *"
        description="Select the curator for this exhibit"
        onSearch={handleUserSearch}
        loading={usersLoading}
      />

      <UserSelector
        users={usersList}
        selectedUserId={featuredArtistId}
        onChange={setFeaturedArtistId}
        label="Featured Artist"
        description="Optionally select a featured artist for this exhibit"
        onSearch={handleUserSearch}
        loading={usersLoading}
      />

      <div>
        <Label>Allowed View Types *</Label>
        <p className="mb-3 text-xs text-muted-foreground">
          Select which view types users can use to view this exhibit
        </p>
        <div className="space-y-2">
          {[
            { value: "gallery", label: "Grid" },
            { value: "constellation", label: "Constellation (3D)" },
            { value: "global", label: "Map" },
          ].map((viewType) => (
            <div key={viewType.value} className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`view-${viewType.value}`}
                checked={allowedViewTypes.includes(viewType.value)}
                onChange={() => handleViewTypeToggle(viewType.value)}
                disabled={
                  allowedViewTypes.length === 1 &&
                  allowedViewTypes.includes(viewType.value)
                }
                className="h-4 w-4 rounded border-input"
              />
              <Label
                htmlFor={`view-${viewType.value}`}
                className="cursor-pointer"
              >
                {viewType.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {submissions.length > 0 && (
        <FeaturedSubmissionSelector
          submissions={submissions}
          selectedSubmissionId={featuredSubmissionId}
          onChange={setFeaturedSubmissionId}
          label="Featured Submission"
          description="Select a submission to feature for this exhibit"
          emptyMessage="No submissions available"
        />
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : mode === "create" ? (
            "Create Exhibit"
          ) : (
            "Update Exhibit"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/exhibits")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
