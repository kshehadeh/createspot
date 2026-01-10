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
  initialData?: SubmissionData;
  onSuccess?: (data?: SubmissionData) => void;
  mode?: "create" | "edit" | "add-to-portfolio";
}

export function SubmissionEditModal({
  isOpen,
  onClose,
  initialData,
  onSuccess,
  mode = "edit",
}: SubmissionEditModalProps) {
  const router = useRouter();

  const handleSuccess = (data?: SubmissionData) => {
    onSuccess?.(data);
    onClose();
    router.refresh();
  };

  const getTitle = () => {
    if (mode === "add-to-portfolio") return "Add to Portfolio";
    if (mode === "create") return "Add Portfolio Item";
    return "Edit Submission";
  };

  const getDescription = () => {
    if (mode === "add-to-portfolio")
      return "Edit your submission details and add it to your portfolio.";
    if (mode === "create")
      return "Create a new portfolio item by adding an image or text, along with details about your work.";
    return "Update your submission details below.";
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 min-h-0 px-6 pb-6">
          <PortfolioItemForm
            mode={mode === "create" ? "create" : "edit"}
            initialData={initialData}
            onSuccess={handleSuccess}
            onCancel={onClose}
            setIsPortfolio={mode === "add-to-portfolio"}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
