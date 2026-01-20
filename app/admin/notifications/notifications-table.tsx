"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { UserAutocomplete } from "@/components/user-autocomplete";

interface Notification {
  id: string;
  type: string;
  sentAt: string;
  userId: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  metadata: string;
  meta: Record<string, unknown>;
}

interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const NOTIFICATION_TYPES = [
  "BADGE_AWARDED",
  "NEW_PROMPT",
  "FAVORITE_ADDED",
  "CRITIQUE_ADDED",
] as const;

export function NotificationsTable() {
  const t = useTranslations("admin.notifications");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [userIdFilter, setUserIdFilter] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (typeFilter && typeFilter !== "all") {
        params.set("type", typeFilter);
      }

      if (userIdFilter) {
        params.set("userId", userIdFilter);
      }

      const response = await fetch(
        `/api/admin/notifications?${params.toString()}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const data: NotificationsResponse = await response.json();
      setNotifications(data.notifications);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, typeFilter, userIdFilter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value);
    setPage(1);
  };

  const handleUserFilterChange = (value: string | null) => {
    setUserIdFilter(value);
    setPage(1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "BADGE_AWARDED":
        return t("typeLabels.badgeAwarded");
      case "NEW_PROMPT":
        return t("typeLabels.newPrompt");
      case "FAVORITE_ADDED":
        return t("typeLabels.favoriteAdded");
      case "CRITIQUE_ADDED":
        return t("typeLabels.critiqueAdded");
      default:
        return type;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Label htmlFor="type-filter">{t("filters.filterByType")}</Label>
          <Select value={typeFilter} onValueChange={handleTypeFilterChange}>
            <SelectTrigger id="type-filter">
              <SelectValue placeholder={t("filters.allTypes")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.allTypes")}</SelectItem>
              {NOTIFICATION_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {getTypeLabel(type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <UserAutocomplete
            value={userIdFilter}
            onChange={handleUserFilterChange}
            label={t("filters.filterByUser")}
            placeholder={t("filters.userIdPlaceholder")}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("columns.date")}</TableHead>
              <TableHead>{t("columns.type")}</TableHead>
              <TableHead>{t("columns.user")}</TableHead>
              <TableHead>{t("columns.metadata")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  {t("loading")}
                </TableCell>
              </TableRow>
            ) : notifications.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-8 text-muted-foreground"
                >
                  {t("noNotifications")}
                </TableCell>
              </TableRow>
            ) : (
              notifications.map((notification) => (
                <TableRow key={notification.id}>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(notification.sentAt)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {getTypeLabel(notification.type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {notification.user ? (
                      <Link
                        href={`/profile/${notification.user.id}`}
                        className="text-primary hover:underline"
                      >
                        {notification.user.name ||
                          notification.user.email ||
                          notification.userId}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">
                        {notification.userId || t("noUser")}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-md truncate">
                    {notification.metadata}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {t("pagination.page")} {page} {t("pagination.of")} {totalPages} (
            {total} {t("pagination.total")})
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
              {t("pagination.previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
            >
              {t("pagination.next")}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
