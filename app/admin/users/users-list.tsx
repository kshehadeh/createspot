"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full">
          <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">
                User
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Email
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Joined
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Role
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {users.map((user) => {
              const isCurrentUser = user.id === currentUserId;
              const isLoading = loadingUserId === user.id;

              return (
                <tr key={user.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {user.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={user.image}
                          alt={user.name || "User"}
                          className="h-8 w-8 rounded-full"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700">
                          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                            {user.name?.charAt(0) || user.email?.charAt(0) || "?"}
                          </span>
                        </div>
                      )}
                      <span className="font-medium text-zinc-900 dark:text-white">
                        {user.name || "No name"}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">
                            (you)
                          </span>
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                    {user.email}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        user.isAdmin
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                          : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                      }`}
                    >
                      {user.isAdmin ? "Admin" : "User"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isCurrentUser ? (
                      <span className="text-xs text-zinc-400 dark:text-zinc-500">
                        Cannot modify
                      </span>
                    ) : (
                      <button
                        onClick={() => toggleAdmin(user.id, user.isAdmin)}
                        disabled={isLoading}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                          user.isAdmin
                            ? "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                            : "bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:hover:bg-purple-900/50"
                        }`}
                      >
                        {isLoading
                          ? "Updating..."
                          : user.isAdmin
                            ? "Remove Admin"
                            : "Make Admin"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
