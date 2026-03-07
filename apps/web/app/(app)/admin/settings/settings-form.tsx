"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SiteSettings, HomepageCarouselFallback } from "@/lib/settings";
import { SubmissionBrowser } from "@/components/submission-browser";
import { getObjectPositionStyle } from "@/lib/image-utils";

interface ExhibitOption {
  id: string;
  title: string;
}

interface HeroSubmission {
  id: string;
  title: string | null;
  imageUrl: string | null;
  imageFocalPoint?: { x: number; y: number } | null;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface SettingsFormProps {
  exhibits: ExhibitOption[];
  initialSettings: SiteSettings;
  initialHeroSubmission: HeroSubmission | null;
}

export function SettingsForm({
  exhibits,
  initialSettings,
  initialHeroSubmission,
}: SettingsFormProps) {
  const router = useRouter();
  const t = useTranslations("admin.settings");
  const tCommon = useTranslations("common");

  const [isSaving, setIsSaving] = useState(false);
  const [homepageCarouselExhibitId, setHomepageCarouselExhibitId] = useState(
    initialSettings.homepageCarouselExhibitId ?? "",
  );
  const [homepageCarouselFallback, setHomepageCarouselFallback] =
    useState<HomepageCarouselFallback>(
      initialSettings.homepageCarouselFallback,
    );
  const [homepageHeroSubmission, setHomepageHeroSubmission] =
    useState<HeroSubmission | null>(initialHeroSubmission);
  const [isHeroBrowserOpen, setIsHeroBrowserOpen] = useState(false);

  const canPickHero = homepageCarouselFallback === "hero";

  const selectedExhibitLabel = useMemo(() => {
    const match = exhibits.find((e) => e.id === homepageCarouselExhibitId);
    return match?.title;
  }, [exhibits, homepageCarouselExhibitId]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homepageCarouselExhibitId: homepageCarouselExhibitId || null,
          homepageCarouselFallback,
          homepageHeroSubmissionId:
            canPickHero && homepageHeroSubmission
              ? homepageHeroSubmission.id
              : null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed");
      }

      toast.success(t("saved"));
      router.refresh();
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {t("homepageCarousel")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("homepageCarouselDescription")}
          </p>
        </div>

        <div className="grid gap-2">
          <Label>{t("selectExhibit")}</Label>
          <Select
            value={homepageCarouselExhibitId || "__none__"}
            onValueChange={(value) =>
              setHomepageCarouselExhibitId(value === "__none__" ? "" : value)
            }
          >
            <SelectTrigger>
              <SelectValue
                placeholder={t("noExhibitSelected")}
                aria-label={selectedExhibitLabel ?? t("noExhibitSelected")}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">{t("noExhibitSelected")}</SelectItem>
              {exhibits.map((exhibit) => (
                <SelectItem key={exhibit.id} value={exhibit.id}>
                  {exhibit.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label>{t("fallbackBehavior")}</Label>
          <Select
            value={homepageCarouselFallback}
            onValueChange={(value) =>
              setHomepageCarouselFallback(value as HomepageCarouselFallback)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">{t("fallbackLatest")}</SelectItem>
              <SelectItem value="hero">{t("fallbackHero")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {canPickHero && (
          <div className="grid gap-2">
            <Label>{t("selectHeroSubmission")}</Label>
            <p className="text-sm text-muted-foreground">
              {t("selectHeroDescription")}
            </p>

            {homepageHeroSubmission ? (
              <div className="flex items-center gap-3 rounded-md border border-border bg-card p-3">
                <div className="relative h-12 w-16 overflow-hidden rounded-md bg-muted">
                  {homepageHeroSubmission.imageUrl ? (
                    <Image
                      src={homepageHeroSubmission.imageUrl}
                      alt={homepageHeroSubmission.title ?? t("untitled")}
                      fill
                      className="object-cover"
                      sizes="64px"
                      style={{
                        objectPosition: getObjectPositionStyle(
                          homepageHeroSubmission.imageFocalPoint,
                        ),
                      }}
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">
                    {homepageHeroSubmission.title ?? t("untitled")}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {homepageHeroSubmission.user.name ?? t("anonymous")}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsHeroBrowserOpen(true)}
                  >
                    {t("change")}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setHomepageHeroSubmission(null)}
                  >
                    {t("clearSelection")}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsHeroBrowserOpen(true)}
              >
                {t("chooseSubmission")}
              </Button>
            )}

            <SubmissionBrowser
              isOpen={isHeroBrowserOpen}
              onClose={() => setIsHeroBrowserOpen(false)}
              preselectedIds={
                homepageHeroSubmission ? [homepageHeroSubmission.id] : []
              }
              onSelect={async (submissionIds) => {
                const id = submissionIds[0];
                if (!id) return;

                try {
                  const response = await fetch(`/api/submissions/${id}`);
                  if (!response.ok) throw new Error("Failed");
                  const data = await response.json();
                  const submission = data.submission as {
                    id: string;
                    title: string | null;
                    imageUrl: string | null;
                    imageFocalPoint: { x: number; y: number } | null;
                    user: {
                      id: string;
                      name: string | null;
                      image: string | null;
                    };
                    shareStatus: string;
                  };

                  if (
                    !submission.imageUrl ||
                    submission.shareStatus !== "PUBLIC"
                  ) {
                    throw new Error("Invalid");
                  }

                  setHomepageHeroSubmission({
                    id: submission.id,
                    title: submission.title,
                    imageUrl: submission.imageUrl,
                    imageFocalPoint: submission.imageFocalPoint,
                    user: submission.user,
                  });
                } catch {
                  toast.error(tCommon("error"));
                }
              }}
            />
          </div>
        )}
      </section>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? tCommon("saving") : tCommon("save")}
        </Button>
      </div>
    </div>
  );
}
