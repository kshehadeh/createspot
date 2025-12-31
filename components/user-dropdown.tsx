"use client";

import Image from "next/image";
import { signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";

interface UserDropdownProps {
  name?: string | null;
  image?: string | null;
}

export function UserDropdown({ name, image }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = () => {
    signOut();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 border-l border-zinc-200 pl-4 dark:border-zinc-700"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {name && (
          <span className="hidden text-sm text-zinc-600 dark:text-zinc-400 sm:inline">
            {name}
          </span>
        )}
        {image ? (
          <Image
            src={image}
            alt={name || "User avatar"}
            width={32}
            height={32}
            className="rounded-full"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-sm font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
            {name?.charAt(0).toUpperCase() || "?"}
          </div>
        )}
        <svg
          className={`h-4 w-4 text-zinc-600 transition-transform dark:text-zinc-400 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
          <div className="py-1">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

