import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AboutCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Extra class for the inner CardContent (e.g. p-6 for tighter padding). */
  contentClassName?: string;
}

/**
 * Shared card for all /about pages.
 * Uses tonal layering instead of visible dividers.
 */
const AboutCard = React.forwardRef<HTMLDivElement, AboutCardProps>(
  ({ className, contentClassName, children, ...props }, ref) => (
    <Card
      ref={ref}
      className={cn(
        "rounded-3xl bg-surface-container shadow-gallery-modal",
        className,
      )}
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
