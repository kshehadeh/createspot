"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@createspot/ui-primitives/avatar";
import { Label } from "@createspot/ui-primitives/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@createspot/ui-primitives/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@createspot/ui-primitives/popover";
import { Button } from "@createspot/ui-primitives/button";
import { Check, X } from "lucide-react";

export interface UserOption {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface UserAutocompleteProps {
  value?: string | null; // Selected user ID
  onChange: (userId: string | null) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function UserAutocomplete({
  value,
  onChange,
  label,
  placeholder = "Search by name or email...",
  className,
  disabled = false,
}: UserAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<UserOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Clear selected user when value is cleared
  useEffect(() => {
    if (!value) {
      setSelectedUser(null);
    }
  }, [value]);

  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/users?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error("Failed to search users");
      }
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Error searching users:", error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        searchUsers(searchQuery);
      }, 300);
    } else {
      setUsers([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, searchUsers]);

  const handleSelect = (user: UserOption) => {
    setSelectedUser(user);
    onChange(user.id);
    setOpen(false);
    setSearchQuery("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedUser(null);
    onChange(null);
    setSearchQuery("");
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSearchQuery("");
      setUsers([]);
    }
  };

  return (
    <div className={className}>
      {label && <Label>{label}</Label>}
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal"
            disabled={disabled}
          >
            {selectedUser ? (
              <div className="flex w-full items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={selectedUser.image || undefined} />
                  <AvatarFallback className="text-xs">
                    {selectedUser.name
                      ? selectedUser.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)
                      : selectedUser.email[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1 truncate">
                  {selectedUser.name || selectedUser.email}
                </span>
                {!disabled && (
                  <X
                    className="h-4 w-4 shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClear(e);
                    }}
                  />
                )}
              </div>
            ) : value ? (
              <span className="text-muted-foreground">User ID: {value}</span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={placeholder}
              value={searchQuery}
              onValueChange={setSearchQuery}
              autoFocus
            />
            <CommandList className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="px-4 py-3 text-sm text-muted-foreground">
                  Searching...
                </div>
              ) : (
                <>
                  <CommandEmpty>
                    {searchQuery.trim()
                      ? "No users found"
                      : "Start typing to search for users"}
                  </CommandEmpty>
                  <CommandGroup>
                    {users.map((user) => (
                      <CommandItem
                        key={user.id}
                        value={`${user.name ?? ""} ${user.email}`.trim()}
                        onSelect={() => handleSelect(user)}
                        className="px-4 py-3"
                      >
                        <div className="flex w-full items-center gap-3">
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
                                : user.email[0]?.toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">
                              {user.name || "Anonymous"}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                          <Check
                            className={`h-4 w-4 shrink-0 text-primary ${
                              selectedUser?.id === user.id
                                ? "opacity-100"
                                : "opacity-0"
                            }`}
                          />
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
