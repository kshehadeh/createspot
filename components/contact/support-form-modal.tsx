"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRecentUrls } from "@/lib/hooks/use-recent-urls";

interface FormData {
  description: string;
  pageUrl: string;
}

interface SupportFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SupportFormModal({ isOpen, onClose }: SupportFormModalProps) {
  const t = useTranslations("contact.support");
  const tCommon = useTranslations("common");
  const { data: session } = useSession();
  const pathname = usePathname();
  const { getRecentUrls } = useRecentUrls();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    description: "",
    pageUrl: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [useCustomUrl, setUseCustomUrl] = useState(false);
  const [availableUrls, setAvailableUrls] = useState<string[]>([]);

  // Load recent URLs and include current page URL when modal opens
  useEffect(() => {
    if (isOpen && typeof window !== "undefined") {
      const currentUrl = `${window.location.origin}${pathname}`;
      const recentUrls = getRecentUrls(10);

      // Combine current URL with recent URLs, avoiding duplicates
      // Current URL should be first, then recent URLs (excluding current)
      const allUrls = [
        currentUrl,
        ...recentUrls.filter((url) => url !== currentUrl),
      ].slice(0, 10);

      setAvailableUrls(allUrls);
      // Always default to dropdown (not custom input)
      setUseCustomUrl(false);
    }
  }, [isOpen, pathname, getRecentUrls]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.description.trim() || !formData.pageUrl.trim()) {
      setError(t("errorRequired"));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: formData.description,
          pageUrl: formData.pageUrl,
          userEmail: session?.user?.email || "",
          userName: session?.user?.name || "Anonymous",
        }),
      });

      if (!response.ok) {
        throw new Error(t("errorSubmit"));
      }

      setSuccess(true);
      setFormData({ description: "", pageUrl: "" });
      setUseCustomUrl(false);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorSubmit"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      // Reset form when modal closes
      setFormData({ description: "", pageUrl: "" });
      setUseCustomUrl(false);
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("formDescription")}</DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-center">
            <p className="text-sm font-medium text-foreground">
              {t("successMessage")}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">{t("descriptionLabel")}</Label>
              <Textarea
                id="description"
                placeholder={t("descriptionPlaceholder")}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pageUrl">{t("urlLabel")}</Label>
              {!useCustomUrl ? (
                <div className="space-y-2">
                  <Select
                    value={formData.pageUrl || ""}
                    onValueChange={(value) => {
                      if (value === "__custom__") {
                        setUseCustomUrl(true);
                        setFormData({ ...formData, pageUrl: "" });
                      } else {
                        setFormData({ ...formData, pageUrl: value });
                      }
                    }}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="pageUrl">
                      <SelectValue placeholder={t("urlSelectPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUrls.map((url) => (
                        <SelectItem key={url} value={url}>
                          {url}
                        </SelectItem>
                      ))}
                      <SelectItem value="__custom__">
                        {t("urlSelectOther")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <Input
                  id="pageUrl"
                  type="url"
                  placeholder={t("urlPlaceholder")}
                  value={formData.pageUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, pageUrl: e.target.value })
                  }
                  disabled={isSubmitting}
                />
              )}
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose(false)}
                disabled={isSubmitting}
              >
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? tCommon("loading") : t("submit")}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
