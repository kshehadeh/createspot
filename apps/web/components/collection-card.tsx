"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Lock, Globe } from "lucide-react";
import { TextThumbnail } from "@/components/text-thumbnail";
import { Card, CardContent } from "@/components/ui/card";
import { getObjectPositionStyle } from "@/lib/image-utils";

interface CollectionCardProps {
  collection: {
    id: string;
    name: string;
    description: string | null;
    isPublic: boolean;
    userId: string;
    submissions: {
      submission: {
        id: string;
        imageUrl: string | null;
        imageFocalPoint: { x: number; y: number } | null;
        text: string | null;
        title: string | null;
      };
    }[];
    _count: {
      submissions: number;
    };
  };
  isOwner?: boolean;
}

export function CollectionCard({ collection }: CollectionCardProps) {
  const t = useTranslations("collections");

  const coverSubmission = collection.submissions[0]?.submission;
  const href = `/creators/${collection.userId}/collections/${collection.id}`;

  return (
    <Link href={href}>
      <Card className="group overflow-hidden transition-all hover:shadow-lg">
        {/* Cover Image */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          {coverSubmission?.imageUrl ? (
            <Image
              src={coverSubmission.imageUrl}
              alt={collection.name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              style={{
                objectPosition: getObjectPositionStyle(
                  coverSubmission.imageFocalPoint,
                ),
              }}
            />
          ) : coverSubmission?.text ? (
            <TextThumbnail
              text={coverSubmission.text}
              className="h-full w-full"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-4xl text-muted-foreground/30">
                {collection.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* Visibility Badge */}
          <div className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm">
            {collection.isPublic ? (
              <Globe className="h-4 w-4 text-green-500" />
            ) : (
              <Lock className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Info */}
        <CardContent className="p-3">
          <h3 className="truncate font-medium text-foreground">
            {collection.name}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t("itemCount", { count: collection._count.submissions })}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
