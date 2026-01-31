"use client";

import {
  createContext,
  use,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

/** Generic contract for favorites context; any provider can implement this. */
export interface FavoritesState {
  favoriteIds: Set<string>;
  isLoading: boolean;
}

export interface FavoritesActions {
  toggleFavorite: (submissionId: string) => Promise<void>;
}

export interface FavoritesMeta {
  isFavorited: (submissionId: string) => boolean;
}

export interface FavoritesContextValue {
  state: FavoritesState;
  actions: FavoritesActions;
  meta: FavoritesMeta;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

interface FavoritesProviderProps {
  children: ReactNode;
  isLoggedIn: boolean;
  initialSubmissionIds?: string[];
}

export function FavoritesProvider({
  children,
  isLoggedIn,
  initialSubmissionIds = [],
}: FavoritesProviderProps) {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn || initialSubmissionIds.length === 0) return;

    const fetchFavorites = async () => {
      try {
        const response = await fetch(
          `/api/favorites?submissionIds=${initialSubmissionIds.join(",")}`,
        );
        if (response.ok) {
          const data = await response.json();
          setFavoriteIds(new Set(data.favoriteIds));
        }
      } catch {
        // Silently fail
      }
    };

    fetchFavorites();
  }, [isLoggedIn, initialSubmissionIds]);

  const toggleFavorite = useCallback(
    async (submissionId: string) => {
      if (!isLoggedIn || isLoading) return;

      setIsLoading(true);
      const wasFavorited = favoriteIds.has(submissionId);

      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (wasFavorited) {
          next.delete(submissionId);
        } else {
          next.add(submissionId);
        }
        return next;
      });

      try {
        if (wasFavorited) {
          const response = await fetch(
            `/api/favorites?submissionId=${submissionId}`,
            { method: "DELETE" },
          );
          if (!response.ok) {
            setFavoriteIds((prev) => new Set([...prev, submissionId]));
          }
        } else {
          const response = await fetch("/api/favorites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ submissionId }),
          });
          if (!response.ok) {
            setFavoriteIds((prev) => {
              const next = new Set(prev);
              next.delete(submissionId);
              return next;
            });
          }
        }
      } catch {
        if (wasFavorited) {
          setFavoriteIds((prev) => new Set([...prev, submissionId]));
        } else {
          setFavoriteIds((prev) => {
            const next = new Set(prev);
            next.delete(submissionId);
            return next;
          });
        }
      } finally {
        setIsLoading(false);
      }
    },
    [isLoggedIn, isLoading, favoriteIds],
  );

  const isFavorited = useCallback(
    (submissionId: string) => favoriteIds.has(submissionId),
    [favoriteIds],
  );

  const value: FavoritesContextValue = {
    state: { favoriteIds, isLoading },
    actions: { toggleFavorite },
    meta: { isFavorited },
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextValue {
  const context = use(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}
