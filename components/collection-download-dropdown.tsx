"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Download,
  FileText,
  Archive,
  Share2,
  ChevronDown,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type CollectionDownloadDropdownProps =
  | {
      variant: "collection";
      collectionId: string;
      collectionName: string;
    }
  | {
      variant: "submission";
      submissionId: string;
      submissionTitle: string;
      hasImage?: boolean;
    };

export function CollectionDownloadDropdown(
  props: CollectionDownloadDropdownProps,
) {
  const t = useTranslations("collections");
  const tSubmission = useTranslations("submission");
  const [isDownloading, setIsDownloading] = useState(false);

  const isCollection = props.variant === "collection";
  const safeName = isCollection
    ? props.collectionName.replace(/[^a-zA-Z0-9]/g, "_")
    : (props.submissionTitle || props.submissionId).replace(
        /[^a-zA-Z0-9]/g,
        "_",
      );

  const pdfUrl = isCollection
    ? `/api/collections/${props.collectionId}/download/pdf`
    : `/api/submissions/${props.submissionId}/download/pdf`;
  const zipUrl = isCollection
    ? `/api/collections/${props.collectionId}/download/zip`
    : `/api/submissions/${props.submissionId}/download/zip`;
  const socialPackUrl = isCollection
    ? `/api/collections/${props.collectionId}/download/social-pack`
    : `/api/submissions/${props.submissionId}/download/social-pack`;
  const imageUrl = !isCollection
    ? `/api/submissions/${props.submissionId}/download/image`
    : null;

  const handleDownloadImage = async () => {
    if (!imageUrl) return;
    setIsDownloading(true);
    try {
      const response = await fetch(imageUrl);
      if (response.ok) {
        const blob = await response.blob();
        const contentDisposition = response.headers.get("Content-Disposition");
        let filename = safeName;
        const match = contentDisposition?.match(/filename="?([^";\n]+)"?/);
        if (match?.[1]) {
          filename = match[1];
        } else {
          const ext = blob.type.includes("webp")
            ? "webp"
            : blob.type.includes("png")
              ? "png"
              : "jpg";
          filename = `${safeName}.${ext}`;
        }
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Failed to download image:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(pdfUrl);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${safeName}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Failed to download PDF:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadZIP = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(zipUrl);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${safeName}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Failed to download ZIP:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadSocialPack = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(socialPackUrl);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${safeName}_social_pack.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Failed to download social pack:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const showDownloadImage =
    !isCollection && props.variant === "submission" && props.hasImage;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isDownloading}>
          {isDownloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          <span className="hidden md:inline">
            {isDownloading ? t("downloading") : t("downloadAs")}
          </span>
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {showDownloadImage && (
          <DropdownMenuItem
            onClick={handleDownloadImage}
            disabled={isDownloading}
          >
            <ImageIcon className="mr-2 h-4 w-4" />
            {tSubmission("downloadImage")}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleDownloadPDF} disabled={isDownloading}>
          <FileText className="mr-2 h-4 w-4" />
          {t("downloadPDF")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownloadZIP} disabled={isDownloading}>
          <Archive className="mr-2 h-4 w-4" />
          {t("downloadZIP")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleDownloadSocialPack}
          disabled={isDownloading}
        >
          <Share2 className="mr-2 h-4 w-4" />
          {t("downloadSocialPack")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
