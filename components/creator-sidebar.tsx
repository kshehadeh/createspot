"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { User, Briefcase, FolderOpen, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { CollectionCreateButton } from "@/components/collection-create-button";

interface CreatorSidebarProps {
  creatorUrl: string;
  creatorName: string | null;
  creatorImage: string | null;
  userId: string;
  collections: Array<{ id: string; name: string | null }>;
}

export function CreatorSidebar({
  creatorUrl,
  creatorName,
  creatorImage,
  userId,
  collections,
}: CreatorSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("creatorNav");
  const tProfile = useTranslations("profile");
  const tCollections = useTranslations("collections");
  const isPublicView = searchParams?.get("view") === "public";

  if (isPublicView) {
    return null;
  }

  const navItems = [
    {
      href: creatorUrl,
      label: t("profile"),
      icon: User,
      isActive: pathname === creatorUrl || pathname === `${creatorUrl}/edit`,
      children: [
        {
          href: `${creatorUrl}/edit`,
          label: tProfile("editProfile"),
          isActive: pathname === `${creatorUrl}/edit`,
        },
        {
          href: `${creatorUrl}?view=public`,
          label: tProfile("viewAsAnonymous"),
          isActive: pathname === creatorUrl && isPublicView,
          target: "_blank",
          rel: "noreferrer",
        },
      ],
    },
    {
      href: `${creatorUrl}/portfolio`,
      label: t("portfolio"),
      icon: Briefcase,
      isActive: pathname.startsWith(`${creatorUrl}/portfolio`),
      children: [
        {
          href: `${creatorUrl}/portfolio/edit`,
          label: tProfile("managePortfolio"),
          isActive: pathname === `${creatorUrl}/portfolio/edit`,
        },
      ],
    },
    {
      href: `${creatorUrl}/collections`,
      label: t("collections"),
      icon: FolderOpen,
      isActive: pathname.startsWith(`${creatorUrl}/collections`),
      children: collections.map((collection) => ({
        href: `${creatorUrl}/collections/${collection.id}`,
        label: collection.name || tCollections("collection"),
        isActive: pathname.startsWith(
          `${creatorUrl}/collections/${collection.id}`,
        ),
      })),
    },
  ];

  return (
    <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-border bg-background">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          {creatorImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={creatorImage}
              alt={creatorName || "Creator"}
              className="h-10 w-10 rounded-full shrink-0"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted shrink-0">
              <span className="text-sm font-medium text-muted-foreground">
                {creatorName?.charAt(0) || "?"}
              </span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">
              {creatorName || "Creator"}
            </p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-2">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  item.isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
              {(item.children.length > 0 ||
                item.href === `${creatorUrl}/collections`) && (
                <div className="mt-2 space-y-1 pl-6">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      target={child.target}
                      rel={child.rel}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                        child.isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                      )}
                    >
                      <ChevronRight className="h-3 w-3" />
                      <span className="truncate">{child.label}</span>
                    </Link>
                  ))}
                  {item.href === `${creatorUrl}/collections` && (
                    <CollectionCreateButton
                      userId={userId}
                      className="w-full justify-start"
                    />
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
