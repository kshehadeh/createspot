"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@createspot/ui-primitives/avatar";
import { Button } from "@createspot/ui-primitives/button";
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
import { cn } from "@/lib/utils";

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
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!open || !onSearch) {
      return;
    }
    const timeoutId = setTimeout(() => {
      onSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [open, searchQuery, onSearch]);

  const selectedUser = users.find((u) => u.id === selectedUserId);

  const filteredUsers = useMemo(() => {
    if (onSearch || !searchQuery) {
      return users;
    }
    const normalized = searchQuery.toLowerCase();
    return users.filter(
      (user) =>
        user.name?.toLowerCase().includes(normalized) ||
        user.email.toLowerCase().includes(normalized),
    );
  }, [onSearch, searchQuery, users]);

  const handleSelect = (userId: string) => {
    onChange(userId);
    setOpen(false);
    setSearchQuery("");
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email[0]?.toUpperCase() ?? "?";
  };

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-foreground">
        {label}
      </label>
      {description && (
        <p className="mb-3 text-xs text-muted-foreground">{description}</p>
      )}
      <Popover
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            setSearchQuery("");
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-auto w-full justify-between px-4 py-3 text-left font-normal"
          >
            {selectedUser ? (
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={selectedUser.image || undefined} />
                  <AvatarFallback className="bg-muted text-muted-foreground">
                    {getInitials(selectedUser.name, selectedUser.email)}
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
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
        >
          <Command shouldFilter={!onSearch}>
            <CommandInput
              placeholder="Search by name or email..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              {loading ? (
                <div className="px-4 py-3 text-sm text-muted-foreground">
                  Loading...
                </div>
              ) : (
                <>
                  <CommandEmpty>
                    {searchQuery ? "No users found" : "No users available"}
                  </CommandEmpty>
                  <CommandGroup>
                    {filteredUsers.map((user) => {
                      const isSelected = selectedUserId === user.id;
                      return (
                        <CommandItem
                          key={user.id}
                          value={`${user.name ?? ""} ${user.email}`.trim()}
                          onSelect={() => handleSelect(user.id)}
                          className="px-4 py-3"
                        >
                          <div className="flex w-full items-center gap-3">
                            <Avatar className="h-10 w-10 shrink-0">
                              <AvatarImage src={user.image || undefined} />
                              <AvatarFallback className="bg-muted text-muted-foreground">
                                {getInitials(user.name, user.email)}
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
                              className={cn(
                                "h-4 w-4 shrink-0 text-primary",
                                isSelected ? "opacity-100" : "opacity-0",
                              )}
                            />
                          </div>
                        </CommandItem>
                      );
                    })}
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
