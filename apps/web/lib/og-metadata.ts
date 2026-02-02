import type { Metadata } from "next";
import { getCreatorUrl } from "@/lib/utils";

const BASE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

export interface SubmissionForMetadata {
  id: string;
  title: string | null;
  text: string | null;
  tags: string[];
  category: string | null;
  user: { id: string; name: string | null; slug: string | null };
  prompt: { word1: string; word2: string; word3: string } | null;
}

export interface CollectionForMetadata {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  user: { id: string; name: string | null; slug: string | null };
  _count: { submissions: number };
}

export interface ExhibitForMetadata {
  id: string;
  title: string;
  description: string | null;
}

/**
 * Builds Open Graph and Twitter metadata for a submission. Uses getCreatorUrl for canonical path.
 */
export function getSubmissionMetadata(
  submission: SubmissionForMetadata,
  baseUrl: string = BASE_URL,
): Metadata {
  const creatorPath = getCreatorUrl(submission.user);
  const canonicalPath = `${creatorPath}/s/${submission.id}`;
  const ogImageUrl = `${baseUrl}${canonicalPath}/opengraph-image`;

  const title = submission.title || "Untitled";
  const creatorName = submission.user.name || "Anonymous";
  const description = submission.text
    ? submission.text.replace(/<[^>]*>/g, "").trim()
    : submission.prompt
      ? `View this submission for the prompt: ${submission.prompt.word1}, ${submission.prompt.word2}, ${submission.prompt.word3}`
      : "View this portfolio piece";

  const keywords: string[] = [];
  if (submission.tags?.length) keywords.push(...submission.tags);
  if (submission.category) keywords.push(submission.category);

  const pageTitle = `${title} | ${creatorName} | Create Spot`;

  return {
    title: pageTitle,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    openGraph: {
      title: pageTitle,
      description,
      images: [ogImageUrl],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
      images: [ogImageUrl],
    },
  };
}

/**
 * Builds Open Graph and Twitter metadata for a public collection. Caller must ensure collection.isPublic.
 */
export function getCollectionMetadata(
  collection: CollectionForMetadata,
  baseUrl: string = BASE_URL,
): Metadata {
  const creatorPath = getCreatorUrl(collection.user);
  const canonicalPath = `${creatorPath}/collections/${collection.id}`;
  const ogImageUrl = `${baseUrl}${canonicalPath}/opengraph-image`;

  const creatorName = collection.user.name || "Anonymous";
  const itemCount = collection._count.submissions;
  const description =
    collection.description ||
    `A collection by ${creatorName} with ${itemCount} ${itemCount !== 1 ? "items" : "item"}`;
  const pageTitle = `${collection.name} - ${creatorName} | Create Spot`;

  return {
    title: pageTitle,
    description,
    openGraph: {
      title: pageTitle,
      description,
      images: [ogImageUrl],
      type: "website",
      url: `${baseUrl}${canonicalPath}`,
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
      images: [ogImageUrl],
    },
  };
}

/**
 * Builds Open Graph and Twitter metadata for an exhibit.
 */
export function getExhibitMetadata(
  exhibit: ExhibitForMetadata,
  baseUrl: string = BASE_URL,
): Metadata {
  const canonicalPath = `/exhibition/${exhibit.id}`;
  const ogImageUrl = `${baseUrl}${canonicalPath}/opengraph-image`;

  const plainDescription = exhibit.description
    ? exhibit.description.replace(/<[^>]*>/g, "").trim()
    : undefined;
  const shortDescription = plainDescription
    ? plainDescription.length > 200
      ? plainDescription.slice(0, 200).replace(/\s+\S*$/, "...")
      : plainDescription
    : `View the ${exhibit.title} exhibit`;

  const pageTitle = `${exhibit.title} | Exhibit | Create Spot`;

  return {
    title: pageTitle,
    description: shortDescription,
    openGraph: {
      title: pageTitle,
      description: shortDescription,
      images: [ogImageUrl],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: shortDescription,
      images: [ogImageUrl],
    },
  };
}
