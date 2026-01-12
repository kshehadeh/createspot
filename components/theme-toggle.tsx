"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-9 items-center rounded-full border border-border bg-secondary px-1">
        <div className="flex h-7 w-7 items-center justify-center">
          <Sun className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    );
  }

  const currentTheme = theme || "system";

  return (
    <div className="flex h-9 items-center rounded-full border border-border bg-secondary px-1">
      <button
        onClick={() => setTheme("dark")}
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-full transition-colors",
          currentTheme === "dark"
            ? "bg-white text-black shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
        aria-label="Dark theme"
      >
        <Moon className="h-4 w-4" />
      </button>
      <button
        onClick={() => setTheme("light")}
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-full transition-colors",
          currentTheme === "light"
            ? "bg-white text-black shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
        aria-label="Light theme"
      >
        <Sun className="h-4 w-4" />
      </button>
      <button
        onClick={() => setTheme("system")}
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-full transition-colors",
          currentTheme === "system"
            ? "bg-white text-black shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
        aria-label="System theme"
      >
        <Monitor className="h-4 w-4" />
      </button>
    </div>
  );
}
