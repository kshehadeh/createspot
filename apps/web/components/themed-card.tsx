"use client";

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
  if (variant === "violet") {
    return (
      <Card
        className={className}
        style={{
          background:
            "linear-gradient(to bottom right, rgba(43, 44, 60, 0.5) 0%, rgba(25, 26, 26, 0.7) 100%)",
        }}
      >
        {children}
      </Card>
    );
  }

  return <Card className={className}>{children}</Card>;
}
