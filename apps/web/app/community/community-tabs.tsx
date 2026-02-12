"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserImageUrl } from "@/lib/user-image";
import { getCreatorUrl } from "@/lib/utils";
import { UserMinus, UserX, UserCheck } from "lucide-react";

type TabType = "followers" | "following" | "blocked";

interface CommunityUser {
  id: string;
  name: string | null;
  image: string | null;
  profileImageUrl: string | null;
  slug: string | null;
  isBlocked?: boolean;
}

function useCommunityList(type: TabType) {
  const [items, setItems] = useState<CommunityUser[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchMore = useCallback(
    async (cursor?: string | null) => {
      const params = new URLSearchParams({ type });
      if (cursor) params.set("cursor", cursor);
      const res = await fetch(`/api/follow/community?${params}`);
      if (!res.ok) return;
      const data = (await res.json()) as {
        items: CommunityUser[];
        nextCursor: string | null;
        hasMore: boolean;
      };
      if (cursor) {
        setItems((prev) => [...prev, ...data.items]);
      } else {
        setItems(data.items);
      }
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    },
    [type],
  );

  useEffect(() => {
    setLoading(true);
    fetchMore(null).finally(() => setLoading(false));
  }, [type, fetchMore]);

  const loadMore = useCallback(() => {
    if (nextCursor && !loading) fetchMore(nextCursor);
  }, [nextCursor, loading, fetchMore]);

  const removeUser = useCallback((id: string) => {
    setItems((prev) => prev.filter((u) => u.id !== id));
  }, []);

  const setUserBlocked = useCallback((id: string, isBlocked: boolean) => {
    setItems((prev) =>
      prev.map((u) => (u.id === id ? { ...u, isBlocked } : u)),
    );
  }, []);

  return {
    items,
    loading,
    hasMore,
    loadMore,
    removeUser,
    setUserBlocked,
  };
}

function FollowingTab() {
  const t = useTranslations("community");
  const tProfile = useTranslations("profile");
  const { items, loading, hasMore, loadMore, removeUser } =
    useCommunityList("following");

  async function handleUnfollow(userId: string) {
    const res = await fetch(
      `/api/follow?followingId=${encodeURIComponent(userId)}`,
      { method: "DELETE" },
    );
    if (res.ok) removeUser(userId);
  }

  if (loading && items.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border py-12 text-center">
        <p className="text-muted-foreground">{t("emptyFollowing")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ul className="divide-y divide-border rounded-lg border border-border bg-card">
        {items.map((user) => {
          const imageUrl = getUserImageUrl(user.profileImageUrl, user.image);
          return (
            <li
              key={user.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:flex-nowrap"
            >
              <Link
                href={getCreatorUrl({ id: user.id, slug: user.slug })}
                className="flex min-w-0 flex-1 items-center gap-3"
              >
                <Avatar className="h-10 w-10 shrink-0">
                  {imageUrl ? <AvatarImage src={imageUrl} alt="" /> : null}
                  <AvatarFallback className="text-sm font-medium">
                    {user.name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate font-medium text-foreground">
                  {user.name || tProfile("anonymous")}
                </span>
              </Link>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleUnfollow(user.id)}
                aria-label={tProfile("unfollow")}
              >
                <UserMinus className="h-4 w-4" />
                <span className="ml-1">{tProfile("unfollow")}</span>
              </Button>
            </li>
          );
        })}
      </ul>
      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={loadMore} disabled={loading}>
            {t("loadMore")}
          </Button>
        </div>
      )}
    </div>
  );
}

function BlockedTab() {
  const t = useTranslations("community");
  const tProfile = useTranslations("profile");
  const { items, loading, hasMore, loadMore, removeUser } =
    useCommunityList("blocked");

  async function handleUnblock(userId: string) {
    const res = await fetch(
      `/api/follow/block?blockedId=${encodeURIComponent(userId)}`,
      { method: "DELETE" },
    );
    if (res.ok) removeUser(userId);
  }

  if (loading && items.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border py-12 text-center">
        <p className="text-muted-foreground">{t("emptyBlocked")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ul className="divide-y divide-border rounded-lg border border-border bg-card">
        {items.map((user) => {
          const imageUrl = getUserImageUrl(user.profileImageUrl, user.image);
          return (
            <li
              key={user.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:flex-nowrap"
            >
              <Link
                href={getCreatorUrl({ id: user.id, slug: user.slug })}
                className="flex min-w-0 flex-1 items-center gap-3"
              >
                <Avatar className="h-10 w-10 shrink-0">
                  {imageUrl ? <AvatarImage src={imageUrl} alt="" /> : null}
                  <AvatarFallback className="text-sm font-medium">
                    {user.name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate font-medium text-foreground">
                  {user.name || tProfile("anonymous")}
                </span>
              </Link>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleUnblock(user.id)}
                aria-label={tProfile("unblock")}
              >
                <UserCheck className="h-4 w-4" />
                <span className="ml-1">{tProfile("unblock")}</span>
              </Button>
            </li>
          );
        })}
      </ul>
      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={loadMore} disabled={loading}>
            {t("loadMore")}
          </Button>
        </div>
      )}
    </div>
  );
}

function FollowersTab() {
  const t = useTranslations("community");
  const tProfile = useTranslations("profile");
  const { items, loading, hasMore, loadMore, setUserBlocked } =
    useCommunityList("followers");

  async function handleBlock(userId: string) {
    const res = await fetch("/api/follow/block", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blockedId: userId }),
    });
    if (res.ok) {
      setUserBlocked(userId, true);
    }
  }

  async function handleUnblock(userId: string) {
    const res = await fetch(
      `/api/follow/block?blockedId=${encodeURIComponent(userId)}`,
      { method: "DELETE" },
    );
    if (res.ok) {
      setUserBlocked(userId, false);
    }
  }

  if (loading && items.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border py-12 text-center">
        <p className="text-muted-foreground">{t("emptyFollowers")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ul className="divide-y divide-border rounded-lg border border-border bg-card">
        {items.map((user) => {
          const imageUrl = getUserImageUrl(user.profileImageUrl, user.image);
          return (
            <li
              key={user.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:flex-nowrap"
            >
              <Link
                href={getCreatorUrl({ id: user.id, slug: user.slug })}
                className="flex min-w-0 flex-1 items-center gap-3"
              >
                <Avatar className="h-10 w-10 shrink-0">
                  {imageUrl ? <AvatarImage src={imageUrl} alt="" /> : null}
                  <AvatarFallback className="text-sm font-medium">
                    {user.name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate font-medium text-foreground">
                  {user.name || tProfile("anonymous")}
                </span>
              </Link>
              {user.isBlocked ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleUnblock(user.id)}
                  aria-label={tProfile("unblock")}
                >
                  <UserCheck className="h-4 w-4" />
                  <span className="ml-1">{tProfile("unblock")}</span>
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleBlock(user.id)}
                  aria-label={tProfile("block")}
                >
                  <UserX className="h-4 w-4" />
                  <span className="ml-1">{tProfile("block")}</span>
                </Button>
              )}
            </li>
          );
        })}
      </ul>
      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={loadMore} disabled={loading}>
            {t("loadMore")}
          </Button>
        </div>
      )}
    </div>
  );
}

export function CommunityTabs() {
  const t = useTranslations("community");
  const [activeTab, setActiveTab] = useState<TabType>("followers");

  return (
    <div>
      <div className="mb-6 flex border-b border-border">
        <Button
          type="button"
          variant={activeTab === "followers" ? "secondary" : "ghost"}
          size="sm"
          className={`rounded-b-none rounded-t-md border-b-2 -mb-px ${
            activeTab === "followers"
              ? "border-secondary"
              : "border-transparent"
          }`}
          onClick={() => setActiveTab("followers")}
        >
          {t("tabFollowers")}
        </Button>
        <Button
          type="button"
          variant={activeTab === "following" ? "secondary" : "ghost"}
          size="sm"
          className={`rounded-b-none rounded-t-md border-b-2 -mb-px ${
            activeTab === "following"
              ? "border-secondary"
              : "border-transparent"
          }`}
          onClick={() => setActiveTab("following")}
        >
          {t("tabFollowing")}
        </Button>
        <Button
          type="button"
          variant={activeTab === "blocked" ? "secondary" : "ghost"}
          size="sm"
          className={`rounded-b-none rounded-t-md border-b-2 -mb-px ${
            activeTab === "blocked"
              ? "border-secondary"
              : "border-transparent"
          }`}
          onClick={() => setActiveTab("blocked")}
        >
          {t("tabBlocked")}
        </Button>
      </div>
      {activeTab === "followers" && <FollowersTab />}
      {activeTab === "following" && <FollowingTab />}
      {activeTab === "blocked" && <BlockedTab />}
    </div>
  );
}
