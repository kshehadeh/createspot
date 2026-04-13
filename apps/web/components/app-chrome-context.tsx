"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

const STORAGE_KEY = "app-sidebar-collapsed";

interface AppChromeContextValue {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarCollapsed: () => void;
  commandOpen: boolean;
  setCommandOpen: Dispatch<SetStateAction<boolean>>;
  createSubmissionOpen: boolean;
  setCreateSubmissionOpen: Dispatch<SetStateAction<boolean>>;
}

const AppChromeContext = createContext<AppChromeContextValue | null>(null);

export function AppChromeProvider({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsedState] = useState(false);
  const [sidebarHydrated, setSidebarHydrated] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [createSubmissionOpen, setCreateSubmissionOpen] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") {
        setSidebarCollapsedState(true);
      }
    } catch {
      /* ignore */
    }
    setSidebarHydrated(true);
  }, []);

  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    setSidebarCollapsedState(collapsed);
  }, []);

  useEffect(() => {
    if (!sidebarHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, sidebarCollapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [sidebarCollapsed, sidebarHydrated]);

  const toggleSidebarCollapsed = useCallback(() => {
    setSidebarCollapsed(!sidebarCollapsed);
  }, [setSidebarCollapsed, sidebarCollapsed]);

  const value = useMemo(
    () => ({
      sidebarCollapsed,
      setSidebarCollapsed,
      toggleSidebarCollapsed,
      commandOpen,
      setCommandOpen,
      createSubmissionOpen,
      setCreateSubmissionOpen,
    }),
    [
      sidebarCollapsed,
      setSidebarCollapsed,
      toggleSidebarCollapsed,
      commandOpen,
      createSubmissionOpen,
    ],
  );

  return (
    <AppChromeContext.Provider value={value}>
      {children}
    </AppChromeContext.Provider>
  );
}

export function useAppChrome(): AppChromeContextValue {
  const ctx = useContext(AppChromeContext);
  if (!ctx) {
    throw new Error("useAppChrome must be used within AppChromeProvider");
  }
  return ctx;
}

/** For components (e.g. mobile drawer) that may render outside `AppChromeProvider` on marketing routes. */
export function useOptionalAppChrome(): AppChromeContextValue | null {
  return useContext(AppChromeContext);
}
