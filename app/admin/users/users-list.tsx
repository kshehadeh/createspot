"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        throw new Error(data.error || "Failed to update user");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
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
                    alt={user.name || "User"}
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
                      {user.name || "No name"}
                    </h3>
                    {isCurrentUser && (
                      <span className="flex-shrink-0 text-xs text-muted-foreground">
                        (you)
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
                  <span className="text-muted-foreground">
                    Joined
                  </span>
                  <span className="text-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Role
                  </span>
                  {user.isAdmin ? (
                    <Badge variant="default">Admin</Badge>
                  ) : (
                    <Badge variant="secondary">User</Badge>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                {isCurrentUser ? (
                  <span className="text-xs text-muted-foreground">
                    Cannot modify your own account
                  </span>
                ) : (
                  <Button
                    onClick={() => toggleAdmin(user.id, user.isAdmin)}
                    disabled={isLoading}
                    variant={user.isAdmin ? "secondary" : "default"}
                    className="w-full"
                  >
                    {isLoading
                      ? "Updating..."
                      : user.isAdmin
                        ? "Remove Admin"
                        : "Make Admin"}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
