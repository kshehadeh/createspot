"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

interface FavoritesContextType {
  favoriteIds: Set<string>;
  isLoading: boolean;
  toggleFavorite: (submissionId: string) => Promise<void>;
  isFavorited: (submissionId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

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

  return (
    <FavoritesContext.Provider
      value={{ favoriteIds, isLoading, toggleFavorite, isFavorited }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}
