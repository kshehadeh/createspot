"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

interface ThemedCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "violet" | "default";
}

export function ThemedCard({
  children,
  className = "",
  variant = "default",
}: ThemedCardProps) {
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    // Check system preference
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const updateTheme = () => {
      const htmlHasDark = document.documentElement.classList.contains("dark");
      const systemPrefersDark = mediaQuery.matches;
      setIsDark(htmlHasDark || systemPrefersDark);
    };
    
    updateTheme();

    // Listen for system preference changes
    const mediaHandler = () => updateTheme();
    mediaQuery.addEventListener("change", mediaHandler);

    // Also observe class changes on html element
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      mediaQuery.removeEventListener("change", mediaHandler);
      observer.disconnect();
    };
  }, []);

  if (variant === "violet") {
    // Use dark style if isDark is true, light style otherwise
    // Default to light style during SSR (isDark === null)
    const useDarkStyle = isDark === true;
    
    const style: React.CSSProperties = useDarkStyle
      ? {
          background:
            "linear-gradient(to bottom right, rgba(30, 27, 75, 0.5) 0%, rgba(30, 27, 75, 0.3) 100%)",
          borderColor: "rgba(76, 29, 149, 0.8)",
        }
      : {
          background:
            "linear-gradient(to bottom right, rgb(245, 243, 255) 0%, rgba(237, 233, 254, 0.5) 100%)",
          borderColor: "rgb(221, 214, 254)",
        };

    return (
      <Card className={className} style={style}>
        {children}
      </Card>
    );
  }

  return <Card className={className}>{children}</Card>;
}
