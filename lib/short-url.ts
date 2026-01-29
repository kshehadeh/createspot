import type { Metadata } from "next";
import { customAlphabet } from "nanoid";
import { prisma } from "@/lib/prisma";
import { getCreatorUrl } from "@/lib/utils";
import {
  getSubmissionMetadata,
  getCollectionMetadata,
  getExhibitMetadata,
} from "@/lib/og-metadata";

const SHORT_CODE_ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const SHORT_CODE_LENGTH = 8;
const generateCode = customAlphabet(SHORT_CODE_ALPHABET, SHORT_CODE_LENGTH);

const BASE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

export type ShortLinkTargetType = "submission" | "collection" | "exhibit";

export interface ResolvedShortLink {
  canonicalPath: string;
  canonicalOgImageUrl: string;
  metadata: Metadata;
}

/**
 * Resolves a short code to the linked entity and builds canonical path, OG image URL, and metadata.
 * Returns null if code not found, entity not viewable (e.g. private), or metadata cannot be built.
 */
export async function resolveShortCode(
  code: string,
): Promise<ResolvedShortLink | null> {
  const shortLink = await prisma.shortLink.findUnique({
    where: { code },
    include: {
      submission: {
        include: {
          user: { select: { id: true, name: true, slug: true } },
          prompt: {
            select: {
              word1: true,
              word2: true,
              word3: true,
            },
          },
        },
      },
      collection: {
        include: {
          user: { select: { id: true, name: true, slug: true } },
          _count: { select: { submissions: true } },
        },
      },
      exhibit: true,
    },
  });

  if (!shortLink) return null;

  if (shortLink.submission) {
    const s = shortLink.submission;
    if (s.shareStatus === "PRIVATE") return null;
    const creatorPath = getCreatorUrl(s.user);
    const canonicalPath = `${creatorPath}/s/${s.id}`;
    const canonicalOgImageUrl = `${BASE_URL}${canonicalPath}/opengraph-image`;
    const metadata = getSubmissionMetadata(
      {
        id: s.id,
        title: s.title,
        text: s.text,
        tags: s.tags ?? [],
        category: s.category,
        user: s.user,
        prompt: s.prompt,
      },
      BASE_URL,
    );
    return { canonicalPath, canonicalOgImageUrl, metadata };
  }

  if (shortLink.collection) {
    const c = shortLink.collection;
    if (!c.isPublic) return null;
    const creatorPath = getCreatorUrl(c.user);
    const canonicalPath = `${creatorPath}/collections/${c.id}`;
    const canonicalOgImageUrl = `${BASE_URL}${canonicalPath}/opengraph-image`;
    const metadata = getCollectionMetadata(
      {
        id: c.id,
        name: c.name,
        description: c.description,
        isPublic: c.isPublic,
        user: c.user,
        _count: c._count,
      },
      BASE_URL,
    );
    return { canonicalPath, canonicalOgImageUrl, metadata };
  }

  if (shortLink.exhibit) {
    const e = shortLink.exhibit;
    const canonicalPath = `/exhibition/${e.id}`;
    const canonicalOgImageUrl = `${BASE_URL}${canonicalPath}/opengraph-image`;
    const metadata = getExhibitMetadata(
      { id: e.id, title: e.title, description: e.description },
      BASE_URL,
    );
    return { canonicalPath, canonicalOgImageUrl, metadata };
  }

  return null;
}

/**
 * Gets or creates a short link for the given target. Returns the short code.
 * Enforces exactly one target type; targetId must exist and be shareable.
 */
export async function getOrCreateShortLink(
  type: ShortLinkTargetType,
  targetId: string,
): Promise<string | null> {
  const existing = await prisma.shortLink.findFirst({
    where:
      type === "submission"
        ? { submissionId: targetId }
        : type === "collection"
          ? { collectionId: targetId }
          : { exhibitId: targetId },
    select: { code: true },
  });
  if (existing) return existing.code;

  let code: string;
  let attempts = 0;
  const maxAttempts = 10;
  do {
    code = generateCode();
    const exists = await prisma.shortLink.findUnique({
      where: { code },
      select: { id: true },
    });
    if (!exists) break;
    attempts++;
  } while (attempts < maxAttempts);
  if (attempts >= maxAttempts) return null;

  const createData =
    type === "submission"
      ? { code, submissionId: targetId }
      : type === "collection"
        ? { code, collectionId: targetId }
        : { code, exhibitId: targetId };

  await prisma.shortLink.create({ data: createData });
  return code;
}
