"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Plus, FolderPlus, Lock, Globe, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TextThumbnail } from "@/components/text-thumbnail";
import { getObjectPositionStyle } from "@/lib/image-utils";

interface Collection {
  id: string;
  name: string;
  isPublic: boolean;
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
}

interface CollectionSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (collectionId: string) => Promise<void>;
  selectedCount: number;
}

export function CollectionSelectModal({
  isOpen,
  onClose,
  onSelect,
  selectedCount,
}: CollectionSelectModalProps) {
  const t = useTranslations("collections");
  const tCommon = useTranslations("common");

  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIsPublic, setNewIsPublic] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCollections();
    }
  }, [isOpen]);

  const fetchCollections = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/collections");
      if (response.ok) {
        const data = await response.json();
        setCollections(data.collections);
      }
    } catch (error) {
      console.error("Failed to fetch collections:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCollection = async () => {
    if (!newName.trim()) return;

    setIsCreating(true);
    try {
      const response = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          isPublic: newIsPublic,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Add to the collection and select it
        await handleSelect(data.collection.id);
      }
    } catch (error) {
      console.error("Failed to create collection:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelect = async (collectionId: string) => {
    setIsAdding(true);
    try {
      await onSelect(collectionId);
      onClose();
    } catch (error) {
      console.error("Failed to add to collection:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleClose = () => {
    setShowCreateForm(false);
    setNewName("");
    setNewIsPublic(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("addToCollection")}</DialogTitle>
          <DialogDescription>
            {t("addToCollectionDescription", { count: selectedCount })}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[300px] overflow-y-auto py-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : showCreateForm ? (
            <div className="space-y-4 p-1">
              <div className="space-y-2">
                <Label htmlFor="collection-name">{t("collectionName")}</Label>
                <Input
                  id="collection-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={t("collectionNamePlaceholder")}
                  autoFocus
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="collection-public">{t("makePublic")}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t("makePublicDescription")}
                  </p>
                </div>
                <Switch
                  id="collection-public"
                  checked={newIsPublic}
                  onCheckedChange={setNewIsPublic}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {/* Create new collection button */}
              <button
                type="button"
                onClick={() => setShowCreateForm(true)}
                className="flex w-full items-center gap-3 rounded-lg border-2 border-dashed border-border p-3 text-left transition-colors hover:border-primary hover:bg-muted/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                  <FolderPlus className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{t("createNew")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("createNewDescription")}
                  </p>
                </div>
                <Plus className="h-4 w-4 text-muted-foreground" />
              </button>

              {/* Existing collections */}
              {collections.map((collection) => {
                const coverSubmission = collection.submissions[0]?.submission;
                return (
                  <button
                    key={collection.id}
                    type="button"
                    onClick={() => handleSelect(collection.id)}
                    disabled={isAdding}
                    className="flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted/50 disabled:opacity-50"
                  >
                    {/* Cover image */}
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                      {coverSubmission?.imageUrl ? (
                        <Image
                          src={coverSubmission.imageUrl}
                          alt={collection.name}
                          fill
                          className="object-cover"
                          sizes="40px"
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
                          <FolderPlus className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Collection info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-medium">
                          {collection.name}
                        </p>
                        {collection.isPublic ? (
                          <Globe className="h-3 w-3 shrink-0 text-green-500" />
                        ) : (
                          <Lock className="h-3 w-3 shrink-0 text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t("itemCount", {
                          count: collection._count.submissions,
                        })}
                      </p>
                    </div>
                  </button>
                );
              })}

              {collections.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  {t("noCollections")}
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {showCreateForm ? (
            <>
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
                disabled={isCreating}
              >
                {tCommon("back")}
              </Button>
              <Button
                onClick={handleCreateCollection}
                disabled={!newName.trim() || isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("creating")}
                  </>
                ) : (
                  t("createAndAdd")
                )}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={handleClose}>
              {tCommon("cancel")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
