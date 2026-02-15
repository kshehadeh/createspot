"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { X } from "lucide-react";
import {
  BaseLightbox,
  type BaseLightboxNavigation,
  type BaseLightboxRenderContext,
  LIGHTBOX_BUTTON_CLASS,
} from "@/components/base-lightbox";
import { getMuseumDisplayName } from "@/lib/museums/museum-display-names";
import type { MuseumArtworkListItem } from "@/lib/museums/types";

function getArtistNames(artists: unknown): string[] {
  if (!Array.isArray(artists)) return [];
  return artists
    .map((a) =>
      a && typeof a === "object" && "name" in a
        ? String((a as { name: string }).name)
        : null,
    )
    .filter((n): n is string => Boolean(n));
}

interface MuseumLightboxProps {
  artwork: MuseumArtworkListItem;
  isOpen: boolean;
  onClose: () => void;
  navigation?: BaseLightboxNavigation;
}

export function MuseumLightbox({
  artwork,
  isOpen,
  onClose,
  navigation,
}: MuseumLightboxProps) {
  const t = useTranslations("museums.lightbox");

  const item = {
    id: artwork.globalId,
    imageUrl: artwork.imageUrl,
    title: artwork.title,
  };

  const artistNames = getArtistNames(artwork.artists);
  const museumName = getMuseumDisplayName(artwork.museumId);
  const dateStr =
    artwork.dateCreated ??
    (artwork.dateStart != null && artwork.dateEnd != null
      ? `${artwork.dateStart}–${artwork.dateEnd}`
      : artwork.dateStart != null
        ? String(artwork.dateStart)
        : artwork.dateEnd != null
          ? String(artwork.dateEnd)
          : null);
  const mediumStr =
    artwork.mediumDisplay ??
    (artwork.mediums?.length ? artwork.mediums.join(", ") : null);

  const baseNavigation: BaseLightboxNavigation | undefined = navigation
    ? {
        ...navigation,
        prevLabel: t("previous"),
        nextLabel: t("next"),
      }
    : undefined;

  const renderControls = useCallback(
    (_context: BaseLightboxRenderContext) => (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={onClose}
            className={LIGHTBOX_BUTTON_CLASS}
            aria-label={t("close")}
          >
            <X className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t("close")}</p>
        </TooltipContent>
      </Tooltip>
    ),
    [onClose, t],
  );

  const renderSidebar = useCallback(
    (_context: BaseLightboxRenderContext) => (
      <div className="flex flex-1 flex-col overflow-y-auto p-6 xl:p-8">
        <h2 className="mb-2 text-2xl font-semibold text-muted-foreground">
          {artwork.title}
        </h2>
        {artistNames.length > 0 && (
          <p className="mb-1 text-sm text-muted-foreground/90">
            {artistNames.join(", ")}
          </p>
        )}
        {museumName && (
          <p className="mb-2 text-sm text-muted-foreground/70">{museumName}</p>
        )}
        {dateStr && (
          <p className="mb-2 text-sm text-muted-foreground/80">{dateStr}</p>
        )}
        {mediumStr && (
          <p className="mb-2 text-sm text-muted-foreground/80">{mediumStr}</p>
        )}
        {artwork.dimensions && (
          <p className="mb-2 text-sm text-muted-foreground/80">
            {artwork.dimensions}
          </p>
        )}
        {artwork.culture && (
          <p className="mb-2 text-sm text-muted-foreground/80">
            {artwork.culture}
          </p>
        )}
        {artwork.creditLine && (
          <p className="mb-4 text-xs text-muted-foreground/60">
            {artwork.creditLine}
          </p>
        )}
        <a
          href={artwork.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-amber-400 hover:text-amber-300 underline"
        >
          {t("viewAtMuseum")}
        </a>
      </div>
    ),
    [
      artwork.title,
      artwork.dimensions,
      artwork.culture,
      artwork.creditLine,
      artwork.sourceUrl,
      artistNames,
      museumName,
      dateStr,
      mediumStr,
      t,
    ],
  );

  const renderMetadataOverlay = useCallback(
    (_context: BaseLightboxRenderContext) => (
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <span className="text-sm font-medium text-white sm:text-base">
          {artwork.title}
        </span>
        {artistNames.length > 0 && (
          <span className="text-xs text-zinc-300 sm:text-sm">
            {artistNames.join(", ")}
          </span>
        )}
        {museumName && (
          <span className="text-xs text-zinc-400 sm:text-sm">{museumName}</span>
        )}
      </div>
    ),
    [artwork.title, artistNames, museumName],
  );

  return (
    <BaseLightbox
      item={item}
      isOpen={isOpen}
      onClose={onClose}
      dialogTitle={artwork.title}
      protectionEnabled={false}
      navigation={baseNavigation}
      renderControls={renderControls}
      renderSidebar={renderSidebar}
      renderMetadataOverlay={renderMetadataOverlay}
    />
  );
}
