"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PortfolioItemForm } from "@/components/portfolio-item-form";

interface SubmissionData {
  id: string;
  title: string | null;
  imageUrl: string | null;
  text: string | null;
  tags: string[];
  category: string | null;
  shareStatus?: "PRIVATE" | "PROFILE" | "PUBLIC";
}

interface SubmissionEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: SubmissionData;
  onSuccess?: (data?: SubmissionData) => void;
}

export function SubmissionEditModal({
  isOpen,
  onClose,
  initialData,
  onSuccess,
}: SubmissionEditModalProps) {
  const router = useRouter();

  const handleSuccess = (data?: SubmissionData) => {
    onSuccess?.(data);
    onClose();
    router.refresh();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Submission</DialogTitle>
          <DialogDescription>
            Update your submission details below.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <PortfolioItemForm
            mode="edit"
            initialData={initialData}
            onSuccess={handleSuccess}
            onCancel={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
