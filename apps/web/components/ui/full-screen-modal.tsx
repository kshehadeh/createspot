"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FullScreenModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  /** When false, hides the close button and prevents Escape key from closing */
  dismissible?: boolean;
}

const FullScreenModal = ({
  open,
  onOpenChange,
  children,
  dismissible = true,
}: FullScreenModalProps) => {
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={dismissible ? onOpenChange : undefined}
    >
      {children}
    </DialogPrimitive.Root>
  );
};

const FullScreenModalContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    dismissible?: boolean;
  }
>(({ className, children, dismissible = true, ...props }, ref) => {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <DialogPrimitive.Content
        ref={ref}
        onEscapeKeyDown={dismissible ? undefined : (e) => e.preventDefault()}
        className={cn(
          "fixed inset-0 z-50 flex flex-col bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200",
          className,
        )}
        {...props}
      >
        {dismissible && (
          <DialogPrimitive.Close className="absolute right-4 top-4 z-10 rounded-sm p-1 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});
FullScreenModalContent.displayName = "FullScreenModalContent";

const FullScreenModalHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex shrink-0 flex-col space-y-1 border-b border-border px-6 py-4 pr-14",
      className,
    )}
    {...props}
  />
);
FullScreenModalHeader.displayName = "FullScreenModalHeader";

const FullScreenModalTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className,
    )}
    {...props}
  />
));
FullScreenModalTitle.displayName = "FullScreenModalTitle";

const FullScreenModalDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
FullScreenModalDescription.displayName = "FullScreenModalDescription";

const FullScreenModalBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("min-h-0 flex-1 overflow-y-auto px-6 py-6", className)}
    {...props}
  />
);
FullScreenModalBody.displayName = "FullScreenModalBody";

const FullScreenModalFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex shrink-0 flex-col-reverse gap-2 border-t border-border px-6 py-4 sm:flex-row sm:justify-end sm:gap-0 sm:space-x-2",
      className,
    )}
    {...props}
  />
);
FullScreenModalFooter.displayName = "FullScreenModalFooter";

export {
  FullScreenModal,
  FullScreenModalContent,
  FullScreenModalHeader,
  FullScreenModalTitle,
  FullScreenModalDescription,
  FullScreenModalBody,
  FullScreenModalFooter,
};

export type { FullScreenModalProps };
