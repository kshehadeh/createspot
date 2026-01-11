"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { DeleteAccountModal } from "@/components/delete-account-modal";

interface User {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  isAdmin: boolean;
  createdAt: Date;
}

interface UsersListProps {
  users: User[];
  currentUserId: string;
}

export function UsersList({ users, currentUserId }: UsersListProps) {
  const router = useRouter();
  const t = useTranslations("admin.users");
  const tProfile = useTranslations("profile");
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalUserId, setDeleteModalUserId] = useState<string | null>(
    null,
  );

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => {
          const isCurrentUser = user.id === currentUserId;
          const isLoading = loadingUserId === user.id;

          return (
            <div
              key={user.id}
              className="rounded-lg border border-border bg-card p-4"
            >
              <div className="flex items-start gap-3">
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.image}
                    alt={user.name || tProfile("anonymous")}
                    className="h-12 w-12 rounded-full"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <span className="text-base font-medium text-muted-foreground">
                      {user.name?.charAt(0) || user.email?.charAt(0) || "?"}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-foreground truncate">
                      {user.name || t("noName")}
                    </h3>
                    {isCurrentUser && (
                      <span className="flex-shrink-0 text-xs text-muted-foreground">
                        {t("you")}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("joined")}</span>
                  <span className="text-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {t("role")}
                  </span>
                  {user.isAdmin ? (
                    <Badge variant="default">{t("admin")}</Badge>
                  ) : (
                    <Badge variant="secondary">{t("user")}</Badge>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                {isCurrentUser ? (
                  <span className="text-xs text-muted-foreground">
                    {t("cannotModifyOwn")}
                  </span>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => toggleAdmin(user.id, user.isAdmin)}
                      disabled={isLoading}
                      variant={user.isAdmin ? "secondary" : "default"}
                      className="flex-1"
                    >
                      {isLoading
                        ? t("updating")
                        : user.isAdmin
                          ? t("removeAdmin")
                          : t("makeAdmin")}
                    </Button>
                    <Button
                      onClick={() => setDeleteModalUserId(user.id)}
                      disabled={isLoading}
                      variant="destructive"
                      className="flex-1"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t("deleteUser")}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

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
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
