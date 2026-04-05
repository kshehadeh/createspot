"use client";

import {
  Content as HoverCardContentPrimitive,
  Portal as HoverCardPortalPrimitive,
  Root as HoverCard,
  Trigger as HoverCardTrigger,
} from "@radix-ui/react-hover-card";
import * as React from "react";

import { cn } from "@/lib/utils";

const HoverCardContent = React.forwardRef<
  React.ElementRef<typeof HoverCardContentPrimitive>,
  React.ComponentPropsWithoutRef<typeof HoverCardContentPrimitive>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <HoverCardPortalPrimitive>
    <HoverCardContentPrimitive
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-72 rounded-md border border-border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-hover-card-content-transform-origin]",
        className,
      )}
      {...props}
    />
  </HoverCardPortalPrimitive>
));
HoverCardContent.displayName = HoverCardContentPrimitive.displayName;

export { HoverCard, HoverCardTrigger, HoverCardContent };
