"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

  const handleStep1Confirm = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
        body: JSON.stringify(
          targetUserId ? { userId: targetUserId } : {},
        ),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete account");
      }

      toast.success(
        isAdminDelete
          ? `Successfully deleted ${targetUserName || "user"}'s account`
          : "Account deleted successfully",
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
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete account. Please try again.",
      );
      setIsDeleting(false);
    }
  };

  const handleStep2Cancel = () => {
    setStep(1);
    setConfirmationText("");
  };

  const isConfirmDisabled = step === 2 && confirmationText !== "DELETE";

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {step === 1
              ? isAdminDelete
                ? `Delete ${targetUserName || "User"}'s Account`
                : "Delete Your Account"
              : isAdminDelete
                ? `Final Confirmation: Delete ${targetUserName || "User"}`
                : "Final Confirmation"}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            {step === 1 ? (
              <div className="space-y-2">
                <div>
                  {isAdminDelete
                    ? `Are you sure you want to delete ${targetUserName || "this user"}'s account? This action cannot be undone.`
                    : "Are you sure you want to delete your account? This action cannot be undone."}
                </div>
                <div className="text-sm text-muted-foreground">
                  This will permanently delete:
                </div>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>The user account</li>
                  <li>All submissions and portfolio items</li>
                  <li>All uploaded images</li>
                  <li>All favorites and related data</li>
                </ul>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  {isAdminDelete
                    ? `This will permanently delete ${targetUserName || "this user"}'s account and all their data. Type 'DELETE' to confirm.`
                    : "This will permanently delete your account and all your data. Type 'DELETE' to confirm."}
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="confirmation-input"
                    className="text-sm font-medium text-foreground"
                  >
                    Type DELETE to confirm:
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
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button
              variant="outline"
              onClick={step === 1 ? handleStep1Cancel : handleStep2Cancel}
              disabled={isDeleting}
            >
              Cancel
            </Button>
          </AlertDialogCancel>
          {step === 1 ? (
            <Button
              variant="destructive"
              onClick={handleStep1Confirm}
              disabled={isDeleting}
            >
              Continue
            </Button>
          ) : (
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                onClick={handleStep2Confirm}
                disabled={isConfirmDisabled || isDeleting}
              >
                {isDeleting
                  ? "Deleting..."
                  : isAdminDelete
                    ? "Delete User"
                    : "Delete My Account"}
              </Button>
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
