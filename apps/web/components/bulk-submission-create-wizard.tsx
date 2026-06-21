"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  CheckCircle2,
  ImagePlus,
  Lock,
  Trash2,
  Unlock,
  Upload,
  XCircle,
} from "lucide-react";
import { Button } from "@createspot/ui-primitives/button";
import { Input } from "@createspot/ui-primitives/input";
import { Label } from "@createspot/ui-primitives/label";
import { Textarea } from "@createspot/ui-primitives/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@createspot/ui-primitives/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CATEGORIES, getCategoryIcon } from "@/lib/categories";
import { filenameToTitle, uploadImageToR2 } from "@/lib/upload-image";
import { cn, getCreatorUrl } from "@/lib/utils";

type UploadStatus = "pending" | "uploading" | "done" | "error";
type SubmitStatus = "pending" | "submitting" | "success" | "error";
type ShareStatus = "PRIVATE" | "PROFILE" | "PUBLIC";
type WizardStep = "upload" | "review" | "results";

interface BulkSubmissionRow {
  id: string;
  fileName: string;
  imageUrl: string;
  title: string;
  text: string;
  tags: string[];
  category: string;
  shareStatus: ShareStatus;
  uploadStatus: UploadStatus;
  uploadError?: string;
  submitStatus: SubmitStatus;
  submitError?: string;
}

type LockedColumn = "title" | "text" | "tags" | "category" | "shareStatus";

interface BulkSubmissionCreateWizardProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface RowTagInputState {
  value: string;
}

const MAX_UPLOAD_CONCURRENCY = 3;

export function BulkSubmissionCreateWizard({
  onSuccess,
  onCancel,
}: BulkSubmissionCreateWizardProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const t = useTranslations("modals.bulkSubmissionWizard");
  const tCommon = useTranslations("common");
  const tCategories = useTranslations("categories");
  const tPortfolio = useTranslations("modals.portfolioItemForm");
  const tCritique = useTranslations("critique");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<WizardStep>("upload");
  const [rows, setRows] = useState<BulkSubmissionRow[]>([]);
  const [globalCritiquesEnabled, setGlobalCritiquesEnabled] = useState(false);
  const [globalIsWorkInProgress, setGlobalIsWorkInProgress] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [lockedColumns, setLockedColumns] = useState<LockedColumn[]>([]);
  const [tagInputs, setTagInputs] = useState<Record<string, RowTagInputState>>(
    {},
  );

  const uploadMessages = useMemo(
    () => ({
      selectImageFile: tPortfolio("errors.selectImageFile"),
      imageTooLarge: tPortfolio("errors.imageTooLarge"),
      uploadFailed: tPortfolio("errors.uploadFailed"),
      presignFailed: tPortfolio("errors.uploadFailed"),
    }),
    [tPortfolio],
  );

  const pendingOrUploadingCount = useMemo(
    () =>
      rows.filter((row) => ["pending", "uploading"].includes(row.uploadStatus))
        .length,
    [rows],
  );

  const readyRows = useMemo(
    () => rows.filter((row) => row.uploadStatus === "done"),
    [rows],
  );

  const successCount = useMemo(
    () => rows.filter((row) => row.submitStatus === "success").length,
    [rows],
  );

  const errorCount = useMemo(
    () => rows.filter((row) => row.submitStatus === "error").length,
    [rows],
  );

  const addFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const imageFiles = Array.from(files).filter((file) =>
        file.type.startsWith("image/"),
      );
      if (imageFiles.length === 0) {
        toast.error(tPortfolio("errors.selectImageFile"));
        return;
      }

      const newRows: BulkSubmissionRow[] = imageFiles.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        fileName: file.name,
        imageUrl: "",
        title: filenameToTitle(file.name),
        text: "",
        tags: [],
        category: "",
        shareStatus: "PRIVATE",
        uploadStatus: "pending",
        submitStatus: "pending",
      }));

      setRows((prev) => [...prev, ...newRows]);

      for (let i = 0; i < newRows.length; i += MAX_UPLOAD_CONCURRENCY) {
        const batch = newRows.slice(i, i + MAX_UPLOAD_CONCURRENCY);
        await Promise.all(
          batch.map((row) => {
            const file = imageFiles.find((f) => f.name === row.fileName);
            if (!file) return Promise.resolve();
            return uploadRowImage(row.id, file);
          }),
        );
      }
    },
    [tPortfolio],
  );

  const uploadRowImage = useCallback(
    async (rowId: string, file: File) => {
      setRows((prev) =>
        prev.map((r) =>
          r.id === rowId ? { ...r, uploadStatus: "uploading" } : r,
        ),
      );

      const result = await uploadImageToR2({
        file,
        type: "submission",
        messages: uploadMessages,
      });

      setRows((prev) =>
        prev.map((r) =>
          r.id === rowId
            ? {
                ...r,
                imageUrl: result.publicUrl || r.imageUrl,
                uploadStatus: result.error ? "error" : "done",
                uploadError: result.error,
              }
            : r,
        ),
      );
    },
    [uploadMessages],
  );

  const updateRow = useCallback(
    (rowId: string, updates: Partial<BulkSubmissionRow>) => {
      setRows((prev) =>
        prev.map((row) => (row.id === rowId ? { ...row, ...updates } : row)),
      );
    },
    [],
  );

  const isColumnLocked = useCallback(
    (column: LockedColumn) => lockedColumns.includes(column),
    [lockedColumns],
  );

  const toggleColumnLock = useCallback((column: LockedColumn) => {
    setLockedColumns((prev) =>
      prev.includes(column)
        ? prev.filter((c) => c !== column)
        : [...prev, column],
    );
  }, []);

  const updateColumnValue = useCallback(
    <K extends LockedColumn>(
      column: K,
      rowId: string,
      value: BulkSubmissionRow[K],
    ) => {
      if (isColumnLocked(column)) {
        setRows((prev) => prev.map((row) => ({ ...row, [column]: value })));
      } else {
        updateRow(rowId, { [column]: value });
      }
    },
    [isColumnLocked, updateRow],
  );

  const updateColumnTags = useCallback(
    (rowId: string, updater: (tags: string[]) => string[]) => {
      if (isColumnLocked("tags")) {
        setRows((prev) => {
          const nextTags = updater(prev[0]?.tags ?? []);
          return prev.map((row) => ({ ...row, tags: nextTags }));
        });
      } else {
        setRows((prev) =>
          prev.map((row) =>
            row.id === rowId ? { ...row, tags: updater(row.tags) } : row,
          ),
        );
      }
    },
    [isColumnLocked],
  );

  const removeRow = useCallback((rowId: string) => {
    setRows((prev) => prev.filter((row) => row.id !== rowId));
  }, []);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      addFiles(e.target.files);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [addFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles],
  );

  const handleTagInputKeyDown = useCallback(
    (rowId: string, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== " " && e.key !== "Enter") return;
      e.preventDefault();
      const inputValue = tagInputs[rowId]?.value?.trim() || "";
      if (!inputValue) return;
      updateColumnTags(rowId, (tags) =>
        tags.includes(inputValue) ? tags : [...tags, inputValue],
      );
      if (isColumnLocked("tags")) {
        setTagInputs(
          Object.fromEntries(
            rows.map((row) => [row.id, { value: "" }]),
          ) as Record<string, RowTagInputState>,
        );
      } else {
        setTagInputs((prev) => ({ ...prev, [rowId]: { value: "" } }));
      }
    },
    [tagInputs, updateColumnTags, isColumnLocked, rows],
  );

  const handleTagInputChange = useCallback((rowId: string, value: string) => {
    setTagInputs((prev) => ({ ...prev, [rowId]: { value } }));
  }, []);

  const removeTag = useCallback(
    (rowId: string, tag: string) => {
      updateColumnTags(rowId, (tags) => tags.filter((t) => t !== tag));
    },
    [updateColumnTags],
  );

  const handleContinueToReview = useCallback(() => {
    if (pendingOrUploadingCount > 0) {
      toast.error(t("errors.waitForUploads"));
      return;
    }
    if (readyRows.length === 0) {
      toast.error(t("errors.addAtLeastOneImage"));
      return;
    }
    setStep("review");
  }, [pendingOrUploadingCount, readyRows.length, t]);

  const submitRow = useCallback(
    async (row: BulkSubmissionRow): Promise<{ success: boolean }> => {
      try {
        const trimmedTags = row.tags
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0);

        const response = await fetch("/api/submissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: row.title || null,
            imageUrl: row.imageUrl || null,
            text: row.text || null,
            isPortfolio: true,
            tags: trimmedTags,
            category: row.category || null,
            shareStatus: row.shareStatus,
            critiquesEnabled:
              row.shareStatus === "PRIVATE" ? false : globalCritiquesEnabled,
            isWorkInProgress: globalIsWorkInProgress,
          }),
        });

        if (!response.ok) {
          return {
            success: false,
          };
        }

        return { success: true };
      } catch {
        return { success: false };
      }
    },
    [globalCritiquesEnabled, globalIsWorkInProgress],
  );

  const handleSubmit = useCallback(async () => {
    const rowsToSubmit = readyRows.filter(
      (row) => row.submitStatus !== "success",
    );
    if (rowsToSubmit.length === 0) {
      toast.error(t("errors.addAtLeastOneImage"));
      return;
    }

    setIsSubmitting(true);
    setRows((prev) =>
      prev.map((row) =>
        rowsToSubmit.some((r) => r.id === row.id)
          ? { ...row, submitStatus: "submitting", submitError: undefined }
          : row,
      ),
    );

    let hasAnySuccess = false;
    for (const row of rowsToSubmit) {
      const result = await submitRow(row);
      setRows((prev) =>
        prev.map((r) =>
          r.id === row.id
            ? {
                ...r,
                submitStatus: result.success ? "success" : "error",
                submitError: result.success ? undefined : t("errors.submitRow"),
              }
            : r,
        ),
      );
      if (result.success) {
        hasAnySuccess = true;
      }
    }

    setIsSubmitting(false);
    setStep("results");

    if (hasAnySuccess) {
      toast.success(t("success.created"));
      if (session?.user?.id) {
        const creatorUrl = getCreatorUrl({
          id: session.user.id,
          slug: session.user.slug ?? null,
        });
        toast.success(t("success.viewPortfolio"), {
          action: {
            label: tCommon("view"),
            onClick: () => router.push(`${creatorUrl}/portfolio`),
          },
        });
      }
      onSuccess?.();
    }
  }, [readyRows, router, session, submitRow, t, tCommon, onSuccess]);

  const handleRetryFailed = useCallback(async () => {
    const failedRows = rows.filter(
      (row) => row.uploadStatus === "error" || row.submitStatus === "error",
    );
    if (failedRows.length === 0) return;

    setRows((prev) =>
      prev.map((row) =>
        failedRows.some((r) => r.id === row.id)
          ? { ...row, submitStatus: "pending", submitError: undefined }
          : row,
      ),
    );

    setIsSubmitting(true);
    for (const row of failedRows) {
      if (row.uploadStatus === "error" || !row.imageUrl) {
        // We no longer have the original file, so we cannot retry an upload failure.
        // Mark as error and skip.
        setRows((prev) =>
          prev.map((r) =>
            r.id === row.id
              ? {
                  ...r,
                  submitStatus: "error",
                  submitError: r.uploadError || t("errors.uploadMissing"),
                }
              : r,
          ),
        );
        continue;
      }
      const result = await submitRow(row);
      setRows((prev) => {
        const current = prev.find((r) => r.id === row.id);
        if (!current) return prev;
        return prev.map((r) =>
          r.id === row.id
            ? {
                ...r,
                submitStatus: result.success ? "success" : "error",
                submitError: result.success ? undefined : t("errors.submitRow"),
              }
            : r,
        );
      });
    }
    setIsSubmitting(false);
  }, [rows, submitRow, t]);

  const renderStepIndicator = () => (
    <div className="mb-6 space-y-3">
      <p className="text-sm font-medium text-muted-foreground">
        {t("stepCounter", {
          current: step === "upload" ? 1 : step === "review" ? 2 : 3,
          total: 3,
        })}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((idx) => (
          <div
            key={idx}
            className={`h-1.5 rounded-full ${
              idx <= (step === "upload" ? 1 : step === "review" ? 2 : 3)
                ? "bg-primary"
                : "bg-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );

  const renderUploadStep = () => (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-base font-semibold">{t("steps.upload.title")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("steps.upload.description")}
        </p>
      </div>

      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50",
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
        />
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <ImagePlus className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">{t("upload.dropFiles")}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("upload.clickToSelect")}
        </p>
        <p className="mt-2 text-xs text-muted-foreground/70">
          {tPortfolio("uploadFormat")}
        </p>
      </div>

      {rows.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {t("upload.filesAdded", { count: rows.length })}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("upload.readyCount", { count: readyRows.length })}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {rows.map((row) => (
              <div
                key={row.id}
                className="relative overflow-hidden rounded-lg border border-border bg-muted"
              >
                <div className="relative aspect-square w-full">
                  {row.imageUrl && row.uploadStatus === "done" ? (
                    <Image
                      src={row.imageUrl}
                      alt={row.title || row.fileName}
                      fill
                      className="object-cover"
                      sizes="128px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      {row.uploadStatus === "uploading" ? (
                        <Upload className="h-5 w-5 animate-bounce text-muted-foreground" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                  )}
                </div>
                <div className="truncate px-2 py-1.5 text-xs text-muted-foreground">
                  {row.fileName}
                </div>
                {row.uploadStatus === "error" && row.uploadError && (
                  <p className="px-2 pb-1.5 text-xs text-destructive">
                    {row.uploadError}
                  </p>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeRow(row.id);
                  }}
                  className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                  aria-label={t("upload.removeFile", { name: row.fileName })}
                  title={t("upload.removeFile", { name: row.fileName })}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between gap-3 border-t border-border/60 pt-6">
        <Button type="button" variant="outline" onClick={onCancel}>
          {tCommon("cancel")}
        </Button>
        <Button
          type="button"
          onClick={handleContinueToReview}
          disabled={pendingOrUploadingCount > 0 || readyRows.length === 0}
        >
          {tCommon("next")}
        </Button>
      </div>
    </div>
  );

  const renderColumnHeader = (column: LockedColumn, label: string) => {
    const locked = isColumnLocked(column);
    return (
      <div className="flex items-center justify-between gap-2">
        <span>{label}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={() => toggleColumnLock(column)}
          aria-label={
            locked
              ? t("table.unlockColumn", { column: label })
              : t("table.lockColumn", { column: label })
          }
          title={
            locked
              ? t("table.unlockColumn", { column: label })
              : t("table.lockColumn", { column: label })
          }
        >
          {locked ? (
            <Lock className="h-3.5 w-3.5 text-primary" />
          ) : (
            <Unlock className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </Button>
      </div>
    );
  };

  const renderTagsCell = (row: BulkSubmissionRow) => {
    const inputValue = tagInputs[row.id]?.value ?? "";
    return (
      <div className="flex min-h-[38px] flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 focus-within:border-ring focus-within:outline-none focus-within:ring-2 focus-within:ring-ring">
        {row.tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(row.id, tag)}
              className="rounded hover:bg-secondary/80"
              aria-label={tPortfolio("removeTag", { tag })}
              title={tPortfolio("removeTag", { tag })}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => handleTagInputChange(row.id, e.target.value)}
          onKeyDown={(e) => handleTagInputKeyDown(row.id, e)}
          placeholder={
            row.tags.length === 0 ? tPortfolio("tagPlaceholder") : ""
          }
          className="flex-1 min-w-[80px] border-0 bg-transparent px-0 py-0.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
      </div>
    );
  };

  const renderReviewStep = () => (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-base font-semibold">{t("steps.review.title")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("steps.review.description")}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <p className="mb-3 text-sm font-medium">{t("sharedSettings")}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <Label htmlFor="bulk-critiques" className="text-sm">
                {tCritique("enableCritiques")}
              </Label>
              <p className="text-xs text-muted-foreground">
                {tCritique("enableCritiquesDescription")}
              </p>
            </div>
            <Switch
              id="bulk-critiques"
              checked={globalCritiquesEnabled}
              onCheckedChange={setGlobalCritiquesEnabled}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <Label htmlFor="bulk-wip" className="text-sm">
                {tPortfolio("workInProgress")}
              </Label>
              <p className="text-xs text-muted-foreground">
                {tPortfolio("workInProgressDescription")}
              </p>
            </div>
            <Switch
              id="bulk-wip"
              checked={globalIsWorkInProgress}
              onCheckedChange={setGlobalIsWorkInProgress}
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <div className="max-h-[60vh] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-background">
              <TableRow>
                <TableHead className="w-16">{t("table.image")}</TableHead>
                <TableHead>
                  {renderColumnHeader("title", tPortfolio("title"))}
                </TableHead>
                <TableHead>
                  {renderColumnHeader("text", tPortfolio("textDescription"))}
                </TableHead>
                <TableHead>
                  {renderColumnHeader("tags", tPortfolio("tags"))}
                </TableHead>
                <TableHead>
                  {renderColumnHeader("category", tPortfolio("category"))}
                </TableHead>
                <TableHead>
                  {renderColumnHeader("shareStatus", tPortfolio("visibility"))}
                </TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="relative h-14 w-14 overflow-hidden rounded-md bg-muted">
                      {row.imageUrl ? (
                        <Image
                          src={row.imageUrl}
                          alt={row.title || row.fileName}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <XCircle className="h-4 w-4 text-destructive" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="text"
                      value={row.title}
                      onChange={(e) =>
                        updateColumnValue("title", row.id, e.target.value)
                      }
                      placeholder={tPortfolio("titlePlaceholder")}
                      className="min-w-[140px]"
                    />
                  </TableCell>
                  <TableCell>
                    <Textarea
                      value={row.text}
                      onChange={(e) =>
                        updateColumnValue("text", row.id, e.target.value)
                      }
                      placeholder={tPortfolio("textPlaceholder")}
                      rows={2}
                      className="min-w-[180px] resize-none"
                    />
                  </TableCell>
                  <TableCell>{renderTagsCell(row)}</TableCell>
                  <TableCell>
                    <Select
                      value={row.category || "__none__"}
                      onValueChange={(value) =>
                        updateColumnValue(
                          "category",
                          row.id,
                          value === "__none__" ? "" : value,
                        )
                      }
                    >
                      <SelectTrigger className="min-w-[140px]">
                        <SelectValue
                          placeholder={tPortfolio("categoryPlaceholder")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">
                          {tPortfolio("categoryNone")}
                        </SelectItem>
                        {CATEGORIES.map((cat) => {
                          const IconComponent = getCategoryIcon(cat);
                          return (
                            <SelectItem key={cat} value={cat}>
                              <div className="flex items-center gap-2">
                                {IconComponent && (
                                  <IconComponent className="h-4 w-4" />
                                )}
                                {tCategories(cat)}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={row.shareStatus}
                      onValueChange={(value) =>
                        updateColumnValue(
                          "shareStatus",
                          row.id,
                          value as ShareStatus,
                        )
                      }
                    >
                      <SelectTrigger className="min-w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PRIVATE">
                          {tPortfolio("shareStatus.private")}
                        </SelectItem>
                        <SelectItem value="PROFILE">
                          {tPortfolio("shareStatus.profileOnly")}
                        </SelectItem>
                        <SelectItem value="PUBLIC">
                          {tPortfolio("shareStatus.public")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRow(row.id)}
                      aria-label={t("table.removeRow")}
                      title={t("table.removeRow")}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex justify-between gap-3 border-t border-border/60 pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep("upload")}
        >
          {tCommon("back")}
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || readyRows.length === 0}
        >
          {isSubmitting ? t("submitting") : t("submit")}
        </Button>
      </div>
    </div>
  );

  const renderResultsStep = () => (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-base font-semibold">{t("steps.results.title")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("steps.results.description")}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-4">
          <CheckCircle2 className="h-6 w-6 text-green-500" />
          <div>
            <p className="text-2xl font-bold">{successCount}</p>
            <p className="text-xs text-muted-foreground">
              {t("results.success", { count: successCount })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-4">
          <XCircle className="h-6 w-6 text-destructive" />
          <div>
            <p className="text-2xl font-bold">{errorCount}</p>
            <p className="text-xs text-muted-foreground">
              {t("results.error", { count: errorCount })}
            </p>
          </div>
        </div>
      </div>

      {errorCount > 0 && (
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="max-h-[40vh] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-background">
                <TableRow>
                  <TableHead>{tPortfolio("title")}</TableHead>
                  <TableHead>{t("results.status")}</TableHead>
                  <TableHead>{t("results.errorMessage")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows
                  .filter(
                    (row) =>
                      row.uploadStatus === "error" ||
                      row.submitStatus === "error",
                  )
                  .map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.title || row.fileName || "-"}</TableCell>
                      <TableCell>
                        {row.submitStatus === "error" ||
                        row.uploadStatus === "error"
                          ? t("results.failed")
                          : t("results.pending")}
                      </TableCell>
                      <TableCell className="text-destructive">
                        {row.submitError || row.uploadError || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <div className="flex justify-between gap-3 border-t border-border/60 pt-6">
        <Button type="button" variant="outline" onClick={onCancel}>
          {tCommon("close")}
        </Button>
        <div className="flex gap-2">
          {errorCount > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={handleRetryFailed}
              disabled={isSubmitting}
            >
              {isSubmitting ? t("retrying") : t("retry")}
            </Button>
          )}
          <Button
            type="button"
            onClick={() => setStep("upload")}
            disabled={isSubmitting}
          >
            {t("addMore")}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-6xl">
      {renderStepIndicator()}
      {step === "upload" && renderUploadStep()}
      {step === "review" && renderReviewStep()}
      {step === "results" && renderResultsStep()}
    </div>
  );
}
