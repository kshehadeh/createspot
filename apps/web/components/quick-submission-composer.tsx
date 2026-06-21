"use client";

import { useTranslations } from "next-intl";
import { Images, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@createspot/ui-primitives/button";
import { SubmissionEditModal } from "@/components/submission-edit-modal";

export function QuickSubmissionComposer() {
  const t = useTranslations("feedComposer");
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isBulkWizardOpen, setIsBulkWizardOpen] = useState(false);

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="min-w-0 text-base font-bold font-permanent-marker">
          <span className="bg-gradient-to-r from-amber-400 via-rose-400 to-violet-400 bg-clip-text text-transparent">
            {t("prompt")}
          </span>
        </p>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={() => setIsBulkWizardOpen(true)}
            aria-label={t("newPostMany")}
            title={t("newPostMany")}
          >
            <Images className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={() => setIsWizardOpen(true)}
            aria-label={t("newPost")}
            title={t("newPost")}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <SubmissionEditModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        mode="create"
      />
      <SubmissionEditModal
        isOpen={isBulkWizardOpen}
        onClose={() => setIsBulkWizardOpen(false)}
        mode="bulk-create"
      />
    </>
  );
}
