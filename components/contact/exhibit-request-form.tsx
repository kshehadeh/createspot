"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
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
import { SubmissionBrowser } from "@/components/submission-browser";

interface SelectedSubmission {
  id: string;
  title: string | null;
  imageUrl: string | null;
  text: string | null;
}

interface FormData {
  exhibitName: string;
  exhibitDescription: string;
  selectedSubmissionIds: string[];
}

export function ExhibitRequestForm() {
  const t = useTranslations("contact.exhibit");
  const tCommon = useTranslations("common");
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBrowser, setShowBrowser] = useState(false);
  const [_selectedSubmissions, setSelectedSubmissions] = useState<
    SelectedSubmission[]
  >([]);
  const [formData, setFormData] = useState<FormData>({
    exhibitName: "",
    exhibitDescription: "",
    selectedSubmissionIds: [],
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSelectSubmissions = (submissionIds: string[]) => {
    // In a real app, you'd fetch these submissions. For now, we'll just store the IDs
    // The API will handle enriching this data
    setFormData({
      ...formData,
      selectedSubmissionIds: submissionIds,
    });
    setShowBrowser(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.exhibitName.trim() || !formData.exhibitDescription.trim()) {
      setError(t("errorRequired"));
      return;
    }

    if (formData.selectedSubmissionIds.length === 0) {
      setError(t("errorNoSubmissions"));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact/exhibit-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exhibitName: formData.exhibitName,
          exhibitDescription: formData.exhibitDescription,
          submissionIds: formData.selectedSubmissionIds,
          userEmail: session?.user?.email || "",
          userName: session?.user?.name || "Anonymous",
        }),
      });

      if (!response.ok) {
        throw new Error(t("errorSubmit"));
      }

      setSuccess(true);
      setFormData({
        exhibitName: "",
        exhibitDescription: "",
        selectedSubmissionIds: [],
      });
      setSelectedSubmissions([]);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorSubmit"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>{t("cta")}</Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
                <Label htmlFor="exhibitName">{t("nameLabel")}</Label>
                <Input
                  id="exhibitName"
                  placeholder={t("namePlaceholder")}
                  value={formData.exhibitName}
                  onChange={(e) =>
                    setFormData({ ...formData, exhibitName: e.target.value })
                  }
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="exhibitDescription">
                  {t("descriptionLabel")}
                </Label>
                <Textarea
                  id="exhibitDescription"
                  placeholder={t("descriptionPlaceholder")}
                  value={formData.exhibitDescription}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      exhibitDescription: e.target.value,
                    })
                  }
                  rows={4}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label>{t("submissionsLabel")}</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowBrowser(true)}
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {t("selectSubmissions")}
                </Button>

                {formData.selectedSubmissionIds.length > 0 && (
                  <div className="rounded-lg border border-border bg-muted p-3 text-sm">
                    <p className="text-muted-foreground">
                      {t("selectedCount", {
                        count: formData.selectedSubmissionIds.length,
                      })}
                    </p>
                  </div>
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
                  onClick={() => setIsOpen(false)}
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

      <SubmissionBrowser
        isOpen={showBrowser}
        onClose={() => setShowBrowser(false)}
        onSelect={handleSelectSubmissions}
        preselectedIds={formData.selectedSubmissionIds}
      />
    </>
  );
}
