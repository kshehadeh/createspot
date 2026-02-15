"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Drawer as VaulDrawer } from "vaul";
import { cn } from "@/lib/utils";
import { useKeyboardVisible } from "@/lib/hooks/use-keyboard-visible";

interface BaseModalContextValue {
  isDesktop: boolean;
}

const BaseModalContext = React.createContext<BaseModalContextValue>({
  isDesktop: true,
});

interface BaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  /** When true, prevents swipe-to-dismiss on mobile drawer */
  dismissible?: boolean;
}

const BaseModal = ({
  open,
  onOpenChange,
  children,
  dismissible = true,
}: BaseModalProps) => {
  // Default to true (Dialog) so SSR renders the SSR-safe Radix Dialog
  const [isDesktop, setIsDesktop] = React.useState(true);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  const contextValue = React.useMemo(() => ({ isDesktop }), [isDesktop]);

  // Before mount, use Dialog (SSR-safe). After mount, switch based on viewport.
  if (!mounted || isDesktop) {
    return (
      <BaseModalContext.Provider value={contextValue}>
        <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
          {children}
        </DialogPrimitive.Root>
      </BaseModalContext.Provider>
    );
  }

  // Mobile: use Vaul Drawer (bottom sheet) - only rendered client-side
  return (
    <BaseModalContext.Provider value={contextValue}>
      <VaulDrawer.Root
        open={open}
        onOpenChange={onOpenChange}
        dismissible={dismissible}
      >
        {children}
      </VaulDrawer.Root>
    </BaseModalContext.Provider>
  );
};

const BaseModalPortal = ({ children }: React.PropsWithChildren<object>) => {
  const { isDesktop } = React.useContext(BaseModalContext);
  if (isDesktop) {
    return <DialogPrimitive.Portal>{children}</DialogPrimitive.Portal>;
  }
  return <>{children}</>;
};

const BaseModalOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => {
  const { isDesktop } = React.useContext(BaseModalContext);

  if (!isDesktop) {
    // Vaul handles its own overlay with dimming
    return null;
  }

  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn(
        "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className,
      )}
      {...props}
    />
  );
});
BaseModalOverlay.displayName = "BaseModalOverlay";

const useBaseModalContent = () => {
  const { isDesktop } = React.useContext(BaseModalContext);
  const { isKeyboardVisible, viewportHeight } = useKeyboardVisible();

  // On mobile, adjust content height when keyboard is visible
  // so sticky headers/footers remain visible above keyboard
  const contentHeight = React.useMemo(() => {
    if (isDesktop) return undefined;
    if (isKeyboardVisible) {
      // Adjust to show content above keyboard
      return viewportHeight;
    }
    return "100dvh"; // Full viewport height on mobile
  }, [isDesktop, isKeyboardVisible, viewportHeight]);

  return { isDesktop, contentHeight };
};

const BaseModalContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const { isDesktop, contentHeight } = useBaseModalContent();

  if (isDesktop) {
    return (
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    );
  }

  // Mobile: Vaul Drawer (bottom sheet)
  return (
    <BaseModalPortal>
      <BaseModalOverlay />
      <VaulDrawer.Content
        ref={ref}
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-background rounded-t-2xl shadow-2xl outline-none",
          className,
        )}
        style={{ height: contentHeight } as React.CSSProperties}
      >
        {/* Drag handle indicator */}
        <div className="mx-auto mt-4 h-1.5 w-12 shrink-0 rounded-full bg-border" />
        {children}
      </VaulDrawer.Content>
    </BaseModalPortal>
  );
});
BaseModalContent.displayName = "BaseModalContent";

const BaseModalHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left shrink-0 px-4 pt-16 pb-2 md:pt-6 md:px-6",
      className,
    )}
    {...props}
  />
);
BaseModalHeader.displayName = "BaseModalHeader";

const BaseModalFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const { isDesktop } = React.useContext(BaseModalContext);
  const { isKeyboardVisible } = useKeyboardVisible();

  // On mobile with keyboard, move footer buttons above keyboard
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-4 md:p-6 shrink-0",
        // When keyboard is visible on mobile, ensure buttons stay visible
        !isDesktop && isKeyboardVisible && "pb-safe",
        className,
      )}
      {...props}
    />
  );
};
BaseModalFooter.displayName = "BaseModalFooter";

const BaseModalTitle = React.forwardRef<
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
BaseModalTitle.displayName = "BaseModalTitle";

const BaseModalDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
BaseModalDescription.displayName = "BaseModalDescription";

const BaseModalScrollArea = ({
  className,
  children,
}: React.PropsWithChildren<{ className?: string }>) => {
  const { isDesktop } = useBaseModalContent();

  // On mobile, scrollable area height needs to account for header/footer
  const scrollAreaStyle = React.useMemo(() => {
    if (isDesktop) return undefined;
    return {
      flex: 1,
      overflowY: "auto" as const,
      WebkitOverflowScrolling: "touch" as const,
    };
  }, [isDesktop]);

  return (
    <div
      className={cn("px-4 pb-4 md:px-6 md:pb-6 min-h-0", className)}
      style={scrollAreaStyle}
    >
      {children}
    </div>
  );
};
BaseModalScrollArea.displayName = "BaseModalScrollArea";

export {
  BaseModal,
  BaseModalContent,
  BaseModalHeader,
  BaseModalFooter,
  BaseModalTitle,
  BaseModalDescription,
  BaseModalScrollArea,
  useBaseModalContent,
};

export type { BaseModalProps };
