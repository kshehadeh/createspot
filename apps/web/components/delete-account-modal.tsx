"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  BaseModal,
  BaseModalContent,
  BaseModalDescription,
  BaseModalFooter,
  BaseModalHeader,
  BaseModalScrollArea,
  BaseModalTitle,
} from "@/components/ui/base-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdminDelete?: boolean;
  targetUserId?: string;
  targetUserName?: string;
  onSuccess?: () => void;
}

export function DeleteAccountModal({
  isOpen,
  onClose,
  isAdminDelete = false,
  targetUserId,
  targetUserName,
  onSuccess,
}: DeleteAccountModalProps) {
  const router = useRouter();
  const t = useTranslations("modals.deleteAccount");
  const tCommon = useTranslations("common");
  const [step, setStep] = useState<1 | 2>(1);
  const [confirmationText, setConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset step and confirmation text when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setConfirmationText("");
      setIsDeleting(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (isDeleting) return;
    setStep(1);
    setConfirmationText("");
    onClose();
  };

  const handleStep1Confirm = () => {
    setStep(2);
  };

  const handleStep1Cancel = () => {
    handleClose();
  };

  const handleStep2Confirm = async () => {
    if (confirmationText !== "DELETE") {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch("/api/user/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(targetUserId ? { userId: targetUserId } : {}),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete account");
      }

      toast.success(
        isAdminDelete
          ? t("accountDeletedAdmin", { name: targetUserName || "user" })
          : t("accountDeleted"),
      );

      if (isAdminDelete) {
        // Admin deletion: close modal and refresh
        handleClose();
        if (onSuccess) {
          onSuccess();
        } else {
          router.refresh();
        }
      } else {
        // Self-deletion: sign out and redirect
        await signOut({ callbackUrl: "/" });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("deleteFailed"));
      setIsDeleting(false);
    }
  };

  const handleStep2Cancel = () => {
    setStep(1);
    setConfirmationText("");
  };

  const isConfirmDisabled = step === 2 && confirmationText !== "DELETE";

  return (
    <BaseModal
      open={isOpen}
      onOpenChange={(open) => !open && handleClose()}
      dismissible={!isDeleting}
    >
      <BaseModalContent>
        <BaseModalHeader>
          <BaseModalTitle>
            {step === 1
              ? isAdminDelete
                ? t("titleAdmin", { name: targetUserName || "User" })
                : t("title")
              : isAdminDelete
                ? t("finalConfirmationAdmin", {
                    name: targetUserName || "User",
                  })
                : t("finalConfirmation")}
          </BaseModalTitle>
        </BaseModalHeader>
        <BaseModalScrollArea>
          <BaseModalDescription asChild>
            {step === 1 ? (
              <div className="space-y-2">
                <div>
                  {isAdminDelete
                    ? t("messageAdmin", { name: targetUserName || "this user" })
                    : t("message")}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t("willDelete")}
                </div>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>{t("userAccount")}</li>
                  <li>{t("allSubmissions")}</li>
                  <li>{t("allImages")}</li>
                  <li>{t("allFavorites")}</li>
                </ul>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  {isAdminDelete
                    ? t("finalMessageAdmin", {
                        name: targetUserName || "this user",
                      })
                    : t("finalMessage")}
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="confirmation-input"
                    className="text-sm font-medium text-foreground"
                  >
                    {t("typeToConfirm")}
                  </label>
                  <Input
                    id="confirmation-input"
                    type="text"
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value)}
                    placeholder="DELETE"
                    disabled={isDeleting}
                    className="font-mono"
                    autoFocus
                  />
                </div>
              </div>
            )}
          </BaseModalDescription>
        </BaseModalScrollArea>
        <BaseModalFooter>
          <Button
            variant="outline"
            onClick={step === 1 ? handleStep1Cancel : handleStep2Cancel}
            disabled={isDeleting}
          >
            {tCommon("cancel")}
          </Button>
          {step === 1 ? (
            <Button
              variant="destructive"
              onClick={handleStep1Confirm}
              disabled={isDeleting}
            >
              {t("continue")}
            </Button>
          ) : (
            <Button
              variant="destructive"
              onClick={handleStep2Confirm}
              disabled={isConfirmDisabled || isDeleting}
            >
              {isDeleting
                ? t("deleting")
                : isAdminDelete
                  ? t("deleteUser")
                  : t("deleteMyAccount")}
            </Button>
          )}
        </BaseModalFooter>
      </BaseModalContent>
    </BaseModal>
  );
}
