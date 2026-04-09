"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Badge } from "@createspot/ui-primitives/badge";
import { Button } from "@createspot/ui-primitives/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@createspot/ui-primitives/dropdown-menu";
import { Input } from "@createspot/ui-primitives/input";
import { Label } from "@createspot/ui-primitives/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@createspot/ui-primitives/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Lock,
  Trash2,
} from "lucide-react";
import { DeleteAccountModal } from "@/components/delete-account-modal";
import { UserStatsModal } from "./user-stats-modal";

interface User {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  isAdmin: boolean;
  createdAt: string;
}

interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface UsersTableProps {
  currentUserId: string;
}

export function UsersTable({ currentUserId }: UsersTableProps) {
  const router = useRouter();
  const t = useTranslations("admin.users");
  const tProfile = useTranslations("profile");

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalUserId, setDeleteModalUserId] = useState<string | null>(
    null,
  );
  const [statsModalUserId, setStatsModalUserId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (search) {
        params.set("search", search);
      }

      if (roleFilter !== "all") {
        params.set("role", roleFilter);
      }

      const response = await fetch(`/api/admin/users?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data: UsersResponse = await response.json();
      setUsers(data.users);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error"));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, roleFilter, t]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value);
    setPage(1);
  };

  async function toggleAdmin(userId: string, currentIsAdmin: boolean) {
    setLoadingUserId(userId);
    setError(null);

    try {
      const response = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isAdmin: !currentIsAdmin }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t("updateError"));
      }

      router.refresh();
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error"));
    } finally {
      setLoadingUserId(null);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Label htmlFor="user-search">{t("search")}</Label>
          <Input
            id="user-search"
            type="text"
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <div className="sm:w-48">
          <Label htmlFor="role-filter">{t("filterByRole")}</Label>
          <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
            <SelectTrigger id="role-filter">
              <SelectValue placeholder={t("allRoles")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allRoles")}</SelectItem>
              <SelectItem value="admin">{t("admin")}</SelectItem>
              <SelectItem value="user">{t("user")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">{t("columns.avatar")}</TableHead>
              <TableHead>{t("columns.name")}</TableHead>
              <TableHead>{t("columns.email")}</TableHead>
              <TableHead>{t("columns.joined")}</TableHead>
              <TableHead>{t("columns.role")}</TableHead>
              <TableHead className="text-right">
                {t("columns.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  {t("loading")}
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  {t("noUsers")}
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const isCurrentUser = user.id === currentUserId;
                const isLoading = loadingUserId === user.id;

                return (
                  <TableRow key={user.id}>
                    <TableCell className="w-10">
                      {user.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={user.image}
                          alt={user.name || tProfile("anonymous")}
                          className="h-8 w-8 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                          <span className="text-xs font-medium text-muted-foreground">
                            {user.name?.charAt(0) ||
                              user.email?.charAt(0) ||
                              "?"}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      <span>{user.name || t("noName")}</span>
                      {isCurrentUser && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {t("you")}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {user.isAdmin ? (
                        <Badge variant="default">{t("admin")}</Badge>
                      ) : (
                        <Badge variant="secondary">{t("user")}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          onClick={() => setStatsModalUserId(user.id)}
                          variant="outline"
                          size="sm"
                        >
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                        {!isCurrentUser && (
                          <>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={isLoading}
                                >
                                  <Lock className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {user.isAdmin ? (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      toggleAdmin(user.id, user.isAdmin)
                                    }
                                  >
                                    {t("makeRegularUser")}
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      toggleAdmin(user.id, user.isAdmin)
                                    }
                                  >
                                    {t("makeAdmin")}
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <Button
                              onClick={() => setDeleteModalUserId(user.id)}
                              disabled={isLoading}
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
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

      {/* Delete User Modal */}
      {deleteModalUserId && (
        <DeleteAccountModal
          isOpen={true}
          onClose={() => setDeleteModalUserId(null)}
          isAdminDelete={true}
          targetUserId={deleteModalUserId}
          targetUserName={
            users.find((u) => u.id === deleteModalUserId)?.name || undefined
          }
          onSuccess={() => {
            setDeleteModalUserId(null);
            fetchUsers();
          }}
        />
      )}

      {/* User Stats Modal */}
      {statsModalUserId && (
        <UserStatsModal
          userId={statsModalUserId}
          userName={users.find((u) => u.id === statsModalUserId)?.name || null}
          isOpen={true}
          onClose={() => setStatsModalUserId(null)}
        />
      )}
    </div>
  );
}
