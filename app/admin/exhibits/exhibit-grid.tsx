"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TextThumbnail } from "@/components/text-thumbnail";
import { ConfirmModal } from "@/components/confirm-modal";
import { isExhibitActive } from "@/lib/exhibit-utils";

interface Exhibit {
  id: string;
  title: string;
  featuredSubmissionId: string | null;
  featuredSubmission: {
    id: string;
    imageUrl: string | null;
    text: string | null;
  } | null;
  startTime: Date;
  endTime: Date;
  isActive: boolean;
  curator: {
    id: string;
    name: string | null;
    image: string | null;
  };
  _count: {
    submissions: number;
  };
}

interface ExhibitGridProps {
  exhibits: Exhibit[];
}

export function ExhibitGrid({ exhibits }: ExhibitGridProps) {
  const router = useRouter();
  const t = useTranslations("admin.exhibits");
  const tProfile = useTranslations("profile");
  const [deletingExhibitId, setDeletingExhibitId] = useState<string | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (exhibitId: string) => {
    setDeletingExhibitId(exhibitId);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingExhibitId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/exhibits/${deletingExhibitId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete exhibit");
      }

      router.refresh();
      setDeletingExhibitId(null);
    } catch (error) {
      console.error("Failed to delete exhibit:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (exhibits.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border py-12 text-center">
        <p className="text-muted-foreground">{t("noExhibits")}</p>
      </div>
    );
  }

  const exhibitToDelete = exhibits.find((e) => e.id === deletingExhibitId);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {exhibits.map((exhibit) => {
          const active = isExhibitActive(exhibit);
          const featuredImage = exhibit.featuredSubmission?.imageUrl;
          const featuredText = exhibit.featuredSubmission?.text;

          return (
            <Card
              key={exhibit.id}
              className="group overflow-hidden border-0 rounded-none transition-shadow duration-300 hover:shadow-[0_0_20px_4px_hsl(var(--ring)/0.3)]"
            >
              <Link href={`/admin/exhibits/${exhibit.id}/edit`}>
                <div className="relative aspect-square overflow-hidden bg-muted cursor-pointer">
                  {featuredImage ? (
                    <Image
                      src={featuredImage}
                      alt={exhibit.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  ) : featuredText ? (
                    <TextThumbnail
                      text={featuredText}
                      className="h-full w-full"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <svg
                        className="h-16 w-16 text-muted-foreground"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
                        />
                      </svg>
                    </div>
                  )}

                  {/* Status badge */}
                  <div className="absolute top-2 right-2">
                    {active ? (
                      <span className="rounded-full bg-green-500/90 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
                        {t("active")}
                      </span>
                    ) : (
                      <span className="rounded-full bg-muted/90 px-2 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm">
                        {exhibit.isActive ? t("upcoming") : t("inactive")}
                      </span>
                    )}
                  </div>

                  {/* Overlay information */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-4">
                    <h3 className="truncate text-sm font-medium text-white drop-shadow-sm">
                      {exhibit.title}
                    </h3>
                    <p className="mt-1 truncate text-xs text-white/80">
                      {exhibit._count.submissions}{" "}
                      {exhibit._count.submissions !== 1
                        ? t("submissions")
                        : t("submission")}
                    </p>
                  </div>
                </div>
              </Link>
              <CardContent className="p-3 space-y-3">
                <div className="flex items-center gap-2">
                  {exhibit.curator.image ? (
                    <Image
                      src={exhibit.curator.image}
                      alt={exhibit.curator.name || t("curator")}
                      width={20}
                      height={20}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="h-5 w-5 rounded-full bg-muted" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {exhibit.curator.name || tProfile("anonymous")}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Link href={`/exhibition/${exhibit.id}`}>
                    <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">{t("view")}</span>
                    </Button>
                  </Link>
                  <Link href={`/admin/exhibits/${exhibit.id}/edit`}>
                    <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">{t("edit")}</span>
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDeleteClick(exhibit.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">{t("delete")}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {exhibitToDelete && (
        <ConfirmModal
          isOpen={true}
          title={t("deleteTitle")}
          message={t("deleteMessage", { title: exhibitToDelete.title })}
          confirmLabel={t("delete")}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingExhibitId(null)}
          isLoading={isDeleting}
        />
      )}
    </>
  );
}
