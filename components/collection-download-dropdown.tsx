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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CollectionDownloadDropdownProps {
  collectionId: string;
  collectionName: string;
}

export function CollectionDownloadDropdown({
  collectionId,
  collectionName,
}: CollectionDownloadDropdownProps) {
  const t = useTranslations("collections");
  const [isDownloading, setIsDownloading] = useState(false);

  const safeName = collectionName.replace(/[^a-zA-Z0-9]/g, "_");

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(
        `/api/collections/${collectionId}/download/pdf`,
      );
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
      const response = await fetch(
        `/api/collections/${collectionId}/download/zip`,
      );
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
      const response = await fetch(
        `/api/collections/${collectionId}/download/social-pack`,
      );
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
