import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_10px_30px_hsl(var(--primary)/0.1)]",
        gradient:
          "bg-gradient-primary-cta text-primary-foreground hover:opacity-95 shadow-[0_10px_30px_hsl(var(--primary)/0.18)]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-outline-variant/15 bg-transparent text-primary hover:bg-surface-bright/35",
        secondary:
          "border border-outline-variant/15 bg-transparent text-primary hover:bg-surface-bright/35",
        ghost: "text-secondary hover:bg-accent hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        fabFilled:
          "border-0 bg-gradient-primary-cta text-primary-foreground shadow-lg hover:opacity-95",
        fabMuted:
          "border-0 bg-surface-container text-foreground shadow-lg ring-1 ring-outline-variant/15 hover:bg-surface-bright hover:text-foreground",
        overlayLight:
          "border-0 bg-glass-surface/70 text-foreground shadow-md backdrop-blur-[20px] hover:bg-glass-surface/85",
        overlayDark:
          "border border-outline-variant/20 bg-glass-surface/70 text-foreground shadow-sm backdrop-blur-[20px] hover:bg-surface-bright/75 hover:text-foreground focus-visible:ring-ring/60 focus-visible:ring-offset-transparent",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    compoundVariants: [
      {
        variant: ["fabFilled", "fabMuted"],
        class:
          "h-12 w-12 min-h-12 rounded-full p-0 gap-0 px-0 py-0 transition-transform hover:scale-105 active:scale-95 [&_svg]:size-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      },
      {
        variant: "overlayLight",
        size: "icon",
        class:
          "rounded-full p-0 [&_svg]:size-5 disabled:pointer-events-none disabled:opacity-0",
      },
      {
        variant: "overlayDark",
        size: "icon",
        class: "rounded-full p-0 [&_svg]:size-4",
      },
      {
        variant: "overlayDark",
        size: "sm",
        class: "rounded-full gap-2 px-4",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export const LIGHTBOX_BUTTON_CLASS = buttonVariants({
  variant: "overlayDark",
  size: "icon",
});

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
