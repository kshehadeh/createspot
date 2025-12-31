"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";

export function AdminDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const isAdminPage = pathname.startsWith("/admin");

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

  const buttonClassName = `text-sm transition-colors dark:hover:text-white ${
    isAdminPage
      ? "text-zinc-900 font-medium dark:text-white"
      : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400"
  }`;

  const linkClassName = (path: string) => {
    const isActive = pathname === path;
    return `block w-full px-4 py-2 text-left text-sm transition-colors ${
      isActive
        ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-700 dark:text-white"
        : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
    }`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1 ${buttonClassName}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span>Admin</span>
        <svg
          className={`h-4 w-4 transition-transform ${
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
            <Link
              href="/admin"
              className={linkClassName("/admin")}
              onClick={() => setIsOpen(false)}
            >
              Manage Prompts
            </Link>
            <Link
              href="/admin/users"
              className={linkClassName("/admin/users")}
              onClick={() => setIsOpen(false)}
            >
              Manage Users
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

