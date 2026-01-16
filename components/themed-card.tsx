"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
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
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Use resolvedTheme which accounts for system preference when theme is "system"
  const isDark = mounted && (resolvedTheme === "dark");

  if (variant === "violet") {
    // Use dark style if resolvedTheme is dark, light style otherwise
    // Default to light style during SSR (when not mounted)
    const useDarkStyle = isDark;

    const style: React.CSSProperties = useDarkStyle
      ? {
          background:
            "linear-gradient(to bottom right, rgba(30, 27, 75, 0.5) 0%, rgba(30, 27, 75, 0.3) 100%)",
          borderColor: "rgba(76, 29, 149, 0.8)",
        }
      : {
          background: "#ffffff",
          borderColor: "rgba(139, 92, 246, 0.5)",
        };

    const cardClassName = useDarkStyle
      ? className
      : `${className} !bg-white`.trim();

    return (
      <Card className={cardClassName} style={style}>
        {children}
      </Card>
    );
  }

  return <Card className={className}>{children}</Card>;
}
