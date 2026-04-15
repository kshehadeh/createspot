"use client";

import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@createspot/ui-primitives/button";
import { SubmissionEditModal } from "@/components/submission-edit-modal";

export function QuickSubmissionComposer() {
  const t = useTranslations("feedComposer");
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="min-w-0 text-base font-bold font-permanent-marker">
          <span className="bg-gradient-to-r from-amber-400 via-rose-400 to-violet-400 bg-clip-text text-transparent">
            {t("prompt")}
          </span>
        </p>
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

      <SubmissionEditModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        mode="create"
      />
    </>
  );
}
