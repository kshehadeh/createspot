"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FeaturedSubmissionSelector } from "@/components/featured-submission-selector";

// Heavy TipTap editor - dynamically import
const RichTextEditor = dynamic(
  () =>
    import("@/components/rich-text-editor").then((mod) => mod.RichTextEditor),
  {
    ssr: false,
    loading: () => (
      <div className="h-32 rounded-md border border-input bg-muted/50 animate-pulse" />
    ),
  },
);
import { UserSelector } from "@/components/user-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  endTime: Date | null;
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
  const t = useTranslations("admin.exhibits");
  const tCommon = useTranslations("common");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to round to the nearest hour
  const roundToHour = (date: Date, hour: number): Date => {
    const result = new Date(date);
    result.setHours(hour, 0, 0, 0);
    return result;
  };

  const [title, setTitle] = useState(exhibit?.title || "");
  const [description, setDescription] = useState(exhibit?.description || "");
  const now = new Date();
  const defaultStart = roundToHour(now, 9); // 9am
  const defaultEnd = roundToHour(now, 17); // 5pm

  const [startTime, setStartTime] = useState(
    exhibit
      ? new Date(exhibit.startTime).toISOString().slice(0, 16)
      : defaultStart.toISOString().slice(0, 16),
  );
  const [endTime, setEndTime] = useState(
    exhibit?.endTime
      ? new Date(exhibit.endTime).toISOString().slice(0, 16)
      : defaultEnd.toISOString().slice(0, 16),
  );
  const [noEndDate, setNoEndDate] = useState(exhibit?.endTime === null);
  const [isActive, setIsActive] = useState(exhibit?.isActive ?? true);
  const [curatorId, setCuratorId] = useState(exhibit?.curatorId || "");
  const [featuredArtistId, setFeaturedArtistId] = useState(
    exhibit?.featuredArtistId || "",
  );
  const [allowedViewTypes, setAllowedViewTypes] = useState<string[]>(
    exhibit?.allowedViewTypes || ["gallery", "constellation"],
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

      if (!startTime || (!endTime && !noEndDate)) {
        setError("Start time is required");
        return;
      }

      if (endTime && new Date(startTime) >= new Date(endTime)) {
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
          endTime: noEndDate ? null : endTime,
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
          throw new Error(data.error || t("saveError"));
        }

        router.push("/admin/exhibits");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : t("saveError"));
      } finally {
        setIsLoading(false);
      }
    },
    [
      title,
      description,
      startTime,
      endTime,
      noEndDate,
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
        <Label htmlFor="title">{t("title")} *</Label>
        <Input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("titlePlaceholder")}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">{t("description")}</Label>
        <RichTextEditor
          value={description}
          onChange={setDescription}
          placeholder={t("descriptionPlaceholder")}
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
              {t("manageContent")}
            </Button>
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="startTime">{t("startTime")} *</Label>
          <Input
            id="startTime"
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="endTime">{t("endTime")}</Label>
          <div className="space-y-2">
            <Input
              id="endTime"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              disabled={noEndDate}
              required={!noEndDate}
            />
            <div className="flex items-center gap-2">
              <Switch
                id="noEndDate"
                checked={noEndDate}
                onCheckedChange={setNoEndDate}
              />
              <div className="flex flex-col">
                <Label htmlFor="noEndDate" className="cursor-pointer">
                  {t("noEndDate")}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t("noEndDateDescription")}
                </p>
              </div>
            </div>
          </div>
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
          {t("active")}
        </Label>
      </div>

      <UserSelector
        users={usersList}
        selectedUserId={curatorId}
        onChange={setCuratorId}
        label={`${t("curator")} *`}
        description={t("curatorDescription")}
        onSearch={handleUserSearch}
        loading={usersLoading}
      />

      <UserSelector
        users={usersList}
        selectedUserId={featuredArtistId}
        onChange={setFeaturedArtistId}
        label={t("featuredArtist")}
        description={t("featuredArtistDescription")}
        onSearch={handleUserSearch}
        loading={usersLoading}
      />

      <div>
        <Label>{t("allowedViewTypes")} *</Label>
        <p className="mb-3 text-xs text-muted-foreground">
          {t("allowedViewTypesDescription")}
        </p>
        <div className="space-y-2">
          {[
            { value: "gallery", label: t("grid") },
            { value: "constellation", label: t("constellation") },
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
          label={t("featuredSubmission")}
          description={t("featuredSubmissionDescription")}
          emptyMessage={t("noSubmissionsAvailable")}
        />
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("saving")}
            </>
          ) : mode === "create" ? (
            t("createExhibit")
          ) : (
            t("updateExhibit")
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/exhibits")}
        >
          {tCommon("cancel")}
        </Button>
      </div>
    </form>
  );
}
