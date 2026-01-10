"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

interface UserOption {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface UserSelectorProps {
  users: UserOption[];
  selectedUserId: string;
  onChange: (userId: string) => void;
  label?: string;
  description?: string;
  onSearch?: (query: string) => void;
  loading?: boolean;
}

export function UserSelector({
  users,
  selectedUserId,
  onChange,
  label = "User",
  description,
  onSearch,
  loading = false,
}: UserSelectorProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  useEffect(() => {
    if (onSearch && searchQuery) {
      const timeoutId = setTimeout(() => {
        onSearch(searchQuery);
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, onSearch]);

  const selectedUser = users.find((u) => u.id === selectedUserId);

  const filteredUsers = searchQuery
    ? users.filter(
        (user) =>
          user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : users;

  const handleSelect = (userId: string) => {
    onChange(userId);
    setIsDropdownOpen(false);
    setSearchQuery("");
  };

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-foreground">
        {label}
      </label>
      {description && (
        <p className="mb-3 text-xs text-muted-foreground">{description}</p>
      )}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex w-full items-center justify-between rounded-lg border border-input bg-background px-4 py-3 text-left text-foreground transition-colors focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
          aria-expanded={isDropdownOpen}
          aria-haspopup="listbox"
        >
          {selectedUser ? (
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={selectedUser.image || undefined} />
                <AvatarFallback className="bg-muted text-muted-foreground">
                  {selectedUser.name
                    ? selectedUser.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)
                    : "?"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {selectedUser.name || "Anonymous"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {selectedUser.email}
                </p>
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground">Select a user</span>
          )}
          <svg
            className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${
              isDropdownOpen ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {isDropdownOpen && (
          <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
            {onSearch && (
              <div className="border-b border-border p-2">
                <Input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                  autoFocus
                />
              </div>
            )}
            <div className="max-h-96 overflow-y-auto py-1">
              {loading ? (
                <div className="px-4 py-3 text-sm text-muted-foreground">
                  Loading...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="px-4 py-3 text-sm text-muted-foreground">
                  {searchQuery ? "No users found" : "No users available"}
                </div>
              ) : (
                filteredUsers.map((user) => {
                  const isSelected = selectedUserId === user.id;
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleSelect(user.id)}
                      className={`w-full px-4 py-3 text-left transition-colors ${
                        isSelected
                          ? "bg-accent text-accent-foreground"
                          : "text-popover-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarImage src={user.image || undefined} />
                          <AvatarFallback className="bg-muted text-muted-foreground">
                            {user.name
                              ? user.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2)
                              : "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-popover-foreground">
                            {user.name || "Anonymous"}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                        {isSelected && (
                          <svg
                            className="h-5 w-5 shrink-0 text-primary"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
