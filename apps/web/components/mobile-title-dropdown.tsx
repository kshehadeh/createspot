"use client";

import { ChevronDown } from "lucide-react";

interface MobileTitleDropdownProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  children: React.ReactNode;
}

export function MobileTitleDropdown({
  open,
  onOpenChange,
  title,
  children,
}: MobileTitleDropdownProps) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className="flex w-full items-center justify-start gap-2 text-left text-2xl font-bold text-foreground"
        aria-expanded={open}
      >
        <span>{title}</span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => onOpenChange(false)}
            aria-hidden
          />
          <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-none border border-border bg-background p-4 shadow-lg">
            {children}
          </div>
        </>
      )}
    </div>
  );
}
