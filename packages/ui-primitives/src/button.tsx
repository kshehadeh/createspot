import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        fabFilled:
          "border-0 bg-primary text-primary-foreground shadow-lg hover:bg-primary/90",
        fabMuted:
          "border-0 bg-background text-foreground shadow-lg ring-1 ring-border hover:bg-accent hover:text-accent-foreground",
        overlayLight:
          "border-0 bg-background/80 text-foreground shadow-md backdrop-blur-sm hover:bg-background",
        overlayDark:
          "border !border-white/20 !bg-white/10 text-white shadow-sm hover:!bg-white/20 hover:!text-white focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
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
