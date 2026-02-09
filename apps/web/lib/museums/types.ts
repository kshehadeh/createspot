export interface Artist {
  name: string;
  role?: string;
  nationality?: string;
  birthYear?: number;
  deathYear?: number;
}

export interface ArtworkResult {
  globalId: string;
  localId: string;
  museumId: string;
  title: string;
  description?: string;
  artists: Artist[];
  imageUrl: string;
  thumbnailUrl?: string;
  additionalImages?: string[];
  mediums: string[];
  mediumDisplay?: string;
  genres: string[];
  classifications: string[];
  tags: string[];
  dateCreated?: string;
  dateStart?: number;
  dateEnd?: number;
  dimensions?: string;
  department?: string;
  culture?: string;
  creditLine?: string;
  provenance?: string;
  isPublicDomain: boolean;
  sourceUrl: string;
  rawMetadata: unknown;
}

/** Shape of a single artwork as returned from the API / getMuseumArtworks (no Prisma). */
export interface MuseumArtworkListItem {
  id: string;
  globalId: string;
  localId: string;
  museumId: string;
  title: string;
  description: string | null;
  artists: unknown;
  imageUrl: string;
  thumbnailUrl: string | null;
  additionalImages: string[];
  mediums: string[];
  mediumDisplay: string | null;
  genres: string[];
  classifications: string[];
  tags: string[];
  dateCreated: string | null;
  dateStart: number | null;
  dateEnd: number | null;
  dimensions: string | null;
  department: string | null;
  culture: string | null;
  creditLine: string | null;
  sourceUrl: string;
}

export interface SearchOptions {
  query: string;
  limit?: number;
  page?: number;
  publicDomainOnly?: boolean;
  hasImageOnly?: boolean;
  museums?: string[];
  artists?: string[];
  mediums?: string[];
  genres?: string[];
  classifications?: string[];
  dateRange?: { start: number; end: number };
}
