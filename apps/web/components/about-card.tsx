import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AboutCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Extra class for the inner CardContent (e.g. p-6 for tighter padding). */
  contentClassName?: string;
}

/**
 * Shared card for all /about pages. Uses theme tokens (bg-card, border-border,
 * text-card-foreground) for consistent, theme-aware styling.
 */
const AboutCard = React.forwardRef<HTMLDivElement, AboutCardProps>(
  ({ className, contentClassName, children, ...props }, ref) => (
    <Card
      ref={ref}
      className={cn("rounded-3xl shadow-sm", className)}
      {...props}
    >
      <CardContent className={cn("p-8", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  ),
);
AboutCard.displayName = "AboutCard";

export { AboutCard };
