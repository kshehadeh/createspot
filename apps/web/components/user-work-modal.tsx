"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  BaseModal,
  BaseModalContent,
  BaseModalDescription,
  BaseModalFooter,
  BaseModalHeader,
  BaseModalTitle,
  BaseModalScrollArea,
} from "@/components/ui/base-modal";
import { Button } from "@/components/ui/button";
import { TextThumbnail } from "@/components/text-thumbnail";
import { getObjectPositionStyle } from "@/lib/image-utils";
import { getCreatorUrl } from "@/lib/utils";

interface Submission {
  id: string;
  title: string | null;
  imageUrl: string | null;
  text: string | null;
  createdAt: string;
  prompt: {
    word1: string;
    word2: string;
    word3: string;
  } | null;
  _count: {
    favorites: number;
  };
}

interface User {
  id: string;
  slug: string | null;
  name: string | null;
  image: string | null;
  city: string | null;
  stateProvince: string | null;
  country: string | null;
}

interface UserWorkModalProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UserWorkModal({ userId, isOpen, onClose }: UserWorkModalProps) {
  const [user, setUser] = useState<User | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      setLoading(true);
      setError(null);
      fetch(`/api/users/${userId}/recent-work`)
        .then((res) => {
          if (!res.ok) {
            throw new Error("Failed to fetch user work");
          }
          return res.json();
        })
        .then((data) => {
          setUser(data.user);
          setSubmissions(data.submissions || []);
        })
        .catch((err) => {
          console.error("Error fetching user work:", err);
          setError(err.message || "Failed to load user work");
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      // Reset state when modal closes
      setUser(null);
      setSubmissions([]);
      setError(null);
    }
  }, [isOpen, userId]);

  const location = user
    ? [user.city, user.stateProvince, user.country].filter(Boolean).join(", ")
    : null;

  return (
    <BaseModal open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <BaseModalContent className="max-w-4xl">
        <BaseModalHeader>
          {loading ? (
            <BaseModalTitle>Loading...</BaseModalTitle>
          ) : error ? (
            <BaseModalTitle>Error</BaseModalTitle>
          ) : user ? (
            <>
              <BaseModalTitle>{user.name || "Anonymous"}</BaseModalTitle>
              {location && (
                <BaseModalDescription>{location}</BaseModalDescription>
              )}
            </>
          ) : (
            <BaseModalTitle>User Work</BaseModalTitle>
          )}
        </BaseModalHeader>

        <BaseModalScrollArea>
          {loading && (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {!loading && !error && user && (
            <>
              {submissions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No public work available.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <AnimatePresence mode="popLayout">
                    {submissions.map((submission, index) => (
                      <motion.div
                        key={submission.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <Link
                          href={
                            user
                              ? `${getCreatorUrl(user)}/s/${submission.id}`
                              : "#"
                          }
                          className="block relative aspect-square rounded-lg overflow-hidden border border-border bg-muted transition-transform hover:scale-[1.02]"
                        >
                          {submission.imageUrl ? (
                            <Image
                              src={submission.imageUrl}
                              alt={submission.title || "Submission"}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 50vw, 33vw"
                              style={{
                                objectPosition: getObjectPositionStyle(
                                  (submission as any).imageFocalPoint,
                                ),
                              }}
                            />
                          ) : submission.text ? (
                            <TextThumbnail
                              text={submission.text}
                              className="h-full w-full"
                            />
                          ) : null}
                        </Link>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}
        </BaseModalScrollArea>

        {!loading && !error && user && (
          <BaseModalFooter>
            <Button asChild variant="outline">
              <Link href={getCreatorUrl(user)}>View Profile</Link>
            </Button>
          </BaseModalFooter>
        )}
      </BaseModalContent>
    </BaseModal>
  );
}
