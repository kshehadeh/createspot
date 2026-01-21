"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { TextThumbnail } from "@/components/text-thumbnail";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Submission {
  id: string;
  title: string | null;
  imageUrl: string | null;
  text: string | null;
  category: string | null;
  tags: string[];
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  prompt: {
    word1: string;
    word2: string;
    word3: string;
  } | null;
  wordIndex: number | null;
}

interface SubmissionBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (submissionIds: string[]) => void;
  excludeIds?: string[];
}

export function SubmissionBrowser({
  isOpen,
  onClose,
  onSelect,
  excludeIds = [],
}: SubmissionBrowserProps) {
  const t = useTranslations("admin.exhibits");
  const tCommon = useTranslations("common");
  const tProfile = useTranslations("profile");
  const tCategories = useTranslations("categories");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [category, setCategory] = useState("");
  const [tag, setTag] = useState("");
  const [query, setQuery] = useState("");
  const [userId, setUserId] = useState("");
  const [users, setUsers] = useState<
    Array<{
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    }>
  >([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [usersLoading, setUsersLoading] = useState(false);
  const [isUserPopoverOpen, setIsUserPopoverOpen] = useState(false);

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (tag) params.set("tag", tag);
      if (query) params.set("q", query);
      if (userId) params.set("userId", userId);

      const response = await fetch(`/api/exhibition?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        const filtered = (data.submissions || []).filter(
          (s: Submission) => !excludeIds.includes(s.id),
        );
        setSubmissions(filtered);
      }
    } catch {
      // Ignore errors
    } finally {
      setLoading(false);
    }
  }, [category, tag, query, userId, excludeIds]);

  const loadUsers = useCallback(async (searchQuery: string = "") => {
    setUsersLoading(true);
    try {
      const url = searchQuery
        ? `/api/users?q=${encodeURIComponent(searchQuery)}`
        : "/api/users";
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch {
      // Ignore errors
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isUserPopoverOpen) {
      loadUsers(userSearchQuery);
    }
  }, [isUserPopoverOpen, userSearchQuery, loadUsers]);

  const loadFacets = useCallback(async () => {
    try {
      const response = await fetch("/api/exhibition/facets");
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
        setTags(data.tags || []);
      }
    } catch {
      // Ignore errors
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadFacets();
      loadSubmissions();
      loadUsers();
      setSelectedIds(new Set());
    }
  }, [isOpen, loadFacets, loadSubmissions, loadUsers]);

  const handleToggleSelection = (submissionId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(submissionId)) {
        next.delete(submissionId);
      } else {
        next.add(submissionId);
      }
      return next;
    });
  };

  const handleSelect = () => {
    onSelect(Array.from(selectedIds));
    setSelectedIds(new Set());
    onClose();
  };

  const handleSelectAll = () => {
    const allIds = new Set(submissions.map((s) => s.id));
    setSelectedIds(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const allSelected =
    submissions.length > 0 && selectedIds.size === submissions.length;
  const someSelected =
    selectedIds.size > 0 && selectedIds.size < submissions.length;

  const getWord = (submission: Submission) => {
    if (submission.prompt && submission.wordIndex) {
      const words = [
        submission.prompt.word1,
        submission.prompt.word2,
        submission.prompt.word3,
      ];
      return words[submission.wordIndex - 1];
    }
    return submission.category || tProfile("portfolio");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-screen h-screen max-w-none max-h-none m-0 rounded-none overflow-hidden flex flex-col p-0 [&>button:last-child]:hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>{t("browseSubmissions")}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          <div className="flex flex-wrap gap-2 px-6 pt-6 pb-4">
            <Input
              placeholder={t("search")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 min-w-[200px]"
            />
            <Select
              value={category || "__all__"}
              onValueChange={(value) =>
                setCategory(value === "__all__" ? "" : value)
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t("category")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{t("allCategories")}</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {tCategories(cat)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={tag || "__all__"}
              onValueChange={(value) =>
                setTag(value === "__all__" ? "" : value)
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t("tag")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{t("allTags")}</SelectItem>
                {tags.map((tagValue) => (
                  <SelectItem key={tagValue} value={tagValue}>
                    #{tagValue}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Popover
              open={isUserPopoverOpen}
              onOpenChange={setIsUserPopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-48 justify-start"
                >
                  {userId
                    ? (() => {
                        const selectedUser = users.find((u) => u.id === userId);
                        return selectedUser ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-4 w-4">
                              <AvatarImage
                                src={selectedUser.image || undefined}
                              />
                              <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                                {selectedUser.name
                                  ? selectedUser.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .toUpperCase()
                                      .slice(0, 2)
                                  : "?"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate">
                              {selectedUser.name || tProfile("anonymous")}
                            </span>
                          </div>
                        ) : (
                          t("selectCreator")
                        );
                      })()
                    : t("allCreators")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="start">
                <div className="p-2 border-b">
                  <Input
                    placeholder={t("searchByNameOrEmail")}
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setUserId("");
                      setIsUserPopoverOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-left transition-colors ${
                      !userId
                        ? "bg-accent text-accent-foreground"
                        : "text-popover-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    <span className="text-sm font-medium">
                      {t("allCreators")}
                    </span>
                  </button>
                  {usersLoading ? (
                    <div className="px-4 py-3 text-sm text-muted-foreground">
                      {tCommon("loading")}
                    </div>
                  ) : users.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-muted-foreground">
                      {userSearchQuery
                        ? t("noUsersFound")
                        : t("noUsersAvailable")}
                    </div>
                  ) : (
                    users.map((user) => {
                      const isSelected = userId === user.id;
                      return (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => {
                            setUserId(user.id);
                            setIsUserPopoverOpen(false);
                          }}
                          className={`w-full px-4 py-3 text-left transition-colors ${
                            isSelected
                              ? "bg-accent text-accent-foreground"
                              : "text-popover-foreground hover:bg-accent hover:text-accent-foreground"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarImage src={user.image || undefined} />
                              <AvatarFallback className="bg-muted text-muted-foreground">
                                {user.name
                                  ? user.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .toUpperCase()
                                      .slice(0, 2)
                                  : "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-popover-foreground">
                                {user.name || tProfile("anonymous")}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {user.email}
                              </p>
                            </div>
                            {isSelected && (
                              <svg
                                className="h-4 w-4 shrink-0 text-primary"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <Button onClick={loadSubmissions} disabled={loading}>
              {loading ? tCommon("loading") : t("search")}
            </Button>
          </div>
          <div className="flex items-center justify-between px-6">
            <div className="flex items-center gap-2">
              {submissions.length > 0 && (
                <>
                  {allSelected ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDeselectAll}
                    >
                      {t("deselectAll")}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                    >
                      {t("selectAll", { count: submissions.length })}
                    </Button>
                  )}
                  {someSelected && (
                    <span className="text-sm text-muted-foreground">
                      {selectedIds.size} {t("of")} {submissions.length}{" "}
                      {t("selected")}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">{tCommon("loading")}</p>
              </div>
            ) : submissions.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">
                  {t("noSubmissionsFound")}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {submissions.map((submission) => {
                  const isSelected = selectedIds.has(submission.id);
                  const word = getWord(submission);
                  return (
                    <div
                      key={submission.id}
                      className={`rounded-lg border p-3 cursor-pointer transition-colors ${
                        isSelected
                          ? "border-primary bg-accent"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => handleToggleSelection(submission.id)}
                    >
                      <div className="flex gap-3">
                        {submission.imageUrl ? (
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                            <Image
                              src={submission.imageUrl}
                              alt={submission.title || word}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          </div>
                        ) : submission.text ? (
                          <TextThumbnail
                            text={submission.text}
                            className="h-16 w-16 shrink-0 rounded-lg"
                          />
                        ) : (
                          <div className="h-16 w-16 shrink-0 rounded-lg bg-muted" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-muted-foreground">
                              {word}
                            </span>
                            {isSelected && (
                              <Badge variant="default">
                                {t("selectedBadge")}
                              </Badge>
                            )}
                          </div>
                          {submission.title && (
                            <p className="text-sm font-medium truncate">
                              {submission.title}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground truncate">
                            {t("by")}{" "}
                            {submission.user.name || tProfile("anonymous")}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between border-t pt-4 px-6 pb-6">
            <p className="text-sm text-muted-foreground">
              {selectedIds.size > 0
                ? t("selectedCount", { count: selectedIds.size })
                : t("noItemsSelected")}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                {tCommon("cancel")}
              </Button>
              <Button onClick={handleSelect} disabled={selectedIds.size === 0}>
                {t("addSelected", { count: selectedIds.size })}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
