"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, HardDrive, Image, User } from "lucide-react";

interface SubmissionItem {
  id: string;
  title: string | null;
  createdAt: string;
  imageSize: number | null;
  formattedSize: string | null;
}

interface UserStats {
  user: {
    id: string;
    name: string | null;
    email: string;
    createdAt: string;
  };
  submissions: {
    total: number;
    items: SubmissionItem[];
  };
  storage: {
    totalBytes: number;
    submissionsBytes: number;
    profileBytes: number;
    formattedTotal: string;
    formattedSubmissions: string;
    formattedProfile: string;
  };
}

interface UserStatsModalProps {
  userId: string;
  userName: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UserStatsModal({
  userId,
  userName,
  isOpen,
  onClose,
}: UserStatsModalProps) {
  const t = useTranslations("admin.users");
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      setLoading(true);
      setError(null);

      fetch(`/api/admin/users/${userId}/stats`)
        .then((res) => {
          if (!res.ok) {
            throw new Error("Failed to fetch stats");
          }
          return res.json();
        })
        .then((data) => {
          setStats(data);
        })
        .catch(() => {
          setError(t("statsError"));
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, userId, t]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t("userStats")}: {userName || t("noName")}
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">
              {t("loadingStats")}
            </span>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {stats && !loading && (
          <div className="space-y-6">
            {/* Storage Overview */}
            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <h3 className="flex items-center gap-2 text-sm font-medium text-foreground mb-4">
                <HardDrive className="h-4 w-4" />
                {t("storageBreakdown")}
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {stats.storage.formattedTotal}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t("totalStorage")}
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Image className="h-4 w-4 text-muted-foreground" />
                    <span className="text-lg font-semibold text-foreground">
                      {stats.storage.formattedSubmissions}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t("submissionStorage")}
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-lg font-semibold text-foreground">
                      {stats.storage.formattedProfile}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t("profileStorage")}
                  </div>
                </div>
              </div>
            </div>

            {/* Works Summary */}
            <div>
              <h3 className="text-sm font-medium text-foreground mb-3">
                {t("totalWorks")}: {stats.submissions.total}
              </h3>

              {stats.submissions.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("noSubmissions")}
                </p>
              ) : (
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                          {t("workTitle")}
                        </th>
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                          {t("workDate")}
                        </th>
                        <th className="text-right px-4 py-2 font-medium text-muted-foreground">
                          {t("workSize")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {stats.submissions.items.map((item) => (
                        <tr key={item.id} className="hover:bg-muted/30">
                          <td className="px-4 py-2 text-foreground">
                            {item.title || (
                              <span className="text-muted-foreground italic">
                                {t("untitled")}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-muted-foreground">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {item.formattedSize ? (
                              <Badge variant="secondary">
                                {item.formattedSize}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
