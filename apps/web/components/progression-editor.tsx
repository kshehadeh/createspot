"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  Plus,
  X,
  GripVertical,
  FileText,
  MessageSquareText,
  Upload,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ConfirmModal } from "@/components/confirm-modal";

// Heavy TipTap editor - dynamically import
const RichTextEditor = dynamic(
  () =>
    import("@/components/rich-text-editor").then((mod) => mod.RichTextEditor),
  {
    ssr: false,
    loading: () => (
      <div className="h-32 rounded-md border border-input bg-muted/50 animate-pulse" />
    ),
  },
);

export interface ProgressionFormItem {
  id?: string; // Undefined for new items not yet saved
  tempId?: string; // Temporary ID for tracking in UI
  imageUrl: string | null;
  text: string | null;
  comment: string | null;
  order: number;
  isNew?: boolean;
  isModified?: boolean;
  isDeleted?: boolean;
}

interface ProgressionEditorProps {
  submissionId: string;
  initialProgressions?: ProgressionFormItem[];
  onChange: (progressions: ProgressionFormItem[]) => void;
  disabled?: boolean;
}

export function ProgressionEditor({
  submissionId,
  initialProgressions = [],
  onChange,
  disabled = false,
}: ProgressionEditorProps) {
  const t = useTranslations("progression");
  const tCommon = useTranslations("common");

  const [progressions, setProgressions] = useState<ProgressionFormItem[]>(
    initialProgressions.map((p, index) => ({
      ...p,
      tempId: p.id || `temp-${Date.now()}-${index}`,
      order: p.order ?? index,
    })),
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<{
    imageUrl: string | null;
    text: string | null;
    comment: string | null;
  }>({
    imageUrl: null,
    text: null,
    comment: null,
  });
  const [uploading, setUploading] = useState(false);
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(
    null,
  );
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const lastProgressionsRef = useRef<ProgressionFormItem[]>(progressions);

  // Filter out deleted items for display
  const visibleProgressions = progressions.filter((p) => !p.isDeleted);
  lastProgressionsRef.current = progressions;

  const handleAddNew = () => {
    setEditingIndex(null);
    setFormData({ imageUrl: null, text: null, comment: null });
    setIsDialogOpen(true);
  };

  const handleEdit = (index: number) => {
    const realIndex = progressions.findIndex(
      (p) => !p.isDeleted && p === visibleProgressions[index],
    );
    const item = progressions[realIndex];
    setEditingIndex(realIndex);
    setFormData({
      imageUrl: item.imageUrl,
      text: item.text,
      comment: item.comment,
    });
    setIsDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return;
    }

    if (file.size > 6 * 1024 * 1024) {
      return;
    }

    setUploading(true);

    try {
      const presignResponse = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileType: file.type,
          fileSize: file.size,
          type: "progression",
          submissionId,
        }),
      });

      if (!presignResponse.ok) {
        throw new Error("Failed to get upload URL");
      }

      const { presignedUrl, publicUrl } = await presignResponse.json();

      const uploadResponse = await fetch(presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image");
      }

      setFormData((prev) => ({ ...prev, imageUrl: publicUrl }));
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, imageUrl: null }));
  };

  const handleSave = () => {
    // Validate: must have imageUrl or text
    if (!formData.imageUrl && !formData.text) {
      return;
    }

    const updated = [...progressions];

    if (editingIndex !== null) {
      // Editing existing
      updated[editingIndex] = {
        ...updated[editingIndex],
        ...formData,
        isModified: true,
      };
    } else {
      // Adding new
      const maxOrder = Math.max(-1, ...visibleProgressions.map((p) => p.order));
      updated.push({
        tempId: `temp-${Date.now()}`,
        ...formData,
        order: maxOrder + 1,
        isNew: true,
      });
    }

    setProgressions(updated);
    onChange(updated);
    setIsDialogOpen(false);
    setEditingIndex(null);
  };

  const handleDelete = (visibleIndex: number) => {
    setDeleteConfirmIndex(visibleIndex);
  };

  const confirmDelete = () => {
    if (deleteConfirmIndex === null) return;

    const item = visibleProgressions[deleteConfirmIndex];
    const realIndex = progressions.findIndex(
      (p) =>
        (p.id && p.id === item.id) || (p.tempId && p.tempId === item.tempId),
    );

    if (realIndex === -1) return;

    const updated = [...progressions];
    if (updated[realIndex].isNew) {
      // Remove new items completely
      updated.splice(realIndex, 1);
    } else {
      // Mark existing items as deleted
      updated[realIndex] = { ...updated[realIndex], isDeleted: true };
    }

    setProgressions(updated);
    onChange(updated);
    setDeleteConfirmIndex(null);
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const updated = [...visibleProgressions];
    const [removed] = updated.splice(draggedIndex, 1);
    updated.splice(index, 0, removed);

    // Update order values and build array in the new order (so display updates)
    const reordered = updated.map((item, i) => ({
      ...item,
      order: i,
      isModified: true,
    }));
    const deletedItems = progressions.filter((p) => p.isDeleted);
    const newProgressions = [...reordered, ...deletedItems];

    lastProgressionsRef.current = newProgressions;
    setProgressions(newProgressions);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null) {
      onChange(lastProgressionsRef.current);
    }
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">{t("progressions")}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddNew}
          disabled={disabled}
        >
          <Plus className="h-4 w-4 mr-1" />
          {t("addProgression")}
        </Button>
      </div>

      {visibleProgressions.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noProgressions")}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          <TooltipProvider delayDuration={300}>
            {visibleProgressions.map((progression, index) => (
              <div
                key={progression.id || progression.tempId}
                draggable={!disabled}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`relative group flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                  draggedIndex === index
                    ? "border-primary opacity-50"
                    : "border-border"
                } ${disabled ? "" : "cursor-move"}`}
              >
                {/* Thumbnail content */}
                {progression.imageUrl ? (
                  <Image
                    src={progression.imageUrl}
                    alt={`Progression ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}

                {/* Indicators */}
                {progression.imageUrl && progression.text && (
                  <div className="absolute bottom-1 right-1 p-0.5 rounded bg-black/60">
                    <FileText className="h-2.5 w-2.5 text-white" />
                  </div>
                )}
                {progression.comment && (
                  <div className="absolute top-1 right-1 p-0.5 rounded bg-black/60">
                    <MessageSquareText className="h-2.5 w-2.5 text-white" />
                  </div>
                )}

                {/* Order number */}
                <div className="absolute bottom-1 left-1 px-1 py-0.5 rounded bg-black/70 text-white text-xs font-medium">
                  {index + 1}
                </div>

                {/* Drag handle */}
                {!disabled && (
                  <div className="absolute top-1 left-1 p-0.5 rounded bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="h-3 w-3 text-white" />
                  </div>
                )}

                {/* Action buttons on hover */}
                {!disabled && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleEdit(index)}
                        >
                          <FileText className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{tCommon("edit")}</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleDelete(index)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{tCommon("delete")}</TooltipContent>
                    </Tooltip>
                  </div>
                )}
              </div>
            ))}
          </TooltipProvider>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingIndex !== null
                ? t("editProgression")
                : t("addProgression")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Image upload */}
            <div className="space-y-2">
              <Label>{t("image")}</Label>
              {formData.imageUrl ? (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden border">
                  <Image
                    src={formData.imageUrl}
                    alt="Progression preview"
                    fill
                    className="object-contain bg-muted"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">
                    {uploading ? "Uploading..." : t("uploadImage")}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
              )}
            </div>

            {/* Text content */}
            <div className="space-y-2">
              <Label>{t("text")}</Label>
              <p className="text-xs text-muted-foreground mb-2">
                {t("textDescription")}
              </p>
              <RichTextEditor
                value={formData.text || ""}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, text: value }))
                }
                placeholder="Enter the creative work at this stage..."
              />
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <Label>{t("comment")}</Label>
              <Textarea
                value={formData.comment || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, comment: e.target.value }))
                }
                placeholder={t("commentPlaceholder")}
                rows={2}
              />
            </div>

            {/* Validation message */}
            {!formData.imageUrl && !formData.text && (
              <p className="text-sm text-destructive">{t("mustHaveContent")}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!formData.imageUrl && !formData.text}
            >
              {tCommon("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmModal
        isOpen={deleteConfirmIndex !== null}
        onCancel={() => setDeleteConfirmIndex(null)}
        onConfirm={confirmDelete}
        title={t("deleteProgression")}
        message={t("deleteProgressionConfirm")}
        confirmLabel={tCommon("delete")}
      />
    </div>
  );
}
