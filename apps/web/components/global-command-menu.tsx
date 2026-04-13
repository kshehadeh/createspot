"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Briefcase,
  FolderOpen,
  Heart,
  Info,
  LayoutDashboard,
  LayoutGrid,
  Plus,
  Rss,
  User,
} from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@createspot/ui-primitives/command";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  VisuallyHidden,
} from "@/components/ui/dialog";
import { useAppChrome } from "@/components/app-chrome-context";
import { cn, getCreatorUrl } from "@/lib/utils";
import { getRoute } from "@/lib/routes";

const CREATORS_INSPIRE_PATH = "/inspire/creators";

const COMMAND_ITEM_CLASS =
  "cursor-pointer rounded-md px-3 py-2.5 text-sm aria-selected:rounded-md aria-selected:bg-surface-container-high";

const COMMAND_ICON_CLASS = "mr-3 h-4 w-4 shrink-0 opacity-90";

interface GlobalCommandMenuUser {
  id?: string;
  slug?: string | null;
  isAdmin?: boolean;
}

interface GlobalCommandMenuProps {
  user?: GlobalCommandMenuUser | null;
}

const SCROLLBAR_IDLE_MS = 700;

export function GlobalCommandMenu({ user }: GlobalCommandMenuProps) {
  const router = useRouter();
  const tNav = useTranslations("navigation");
  const tCreator = useTranslations("creatorNav");
  const { commandOpen, setCommandOpen, setCreateSubmissionOpen } =
    useAppChrome();
  const [listScrolling, setListScrolling] = useState(false);
  const scrollIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCommandListScroll = useCallback(() => {
    setListScrolling(true);
    if (scrollIdleTimerRef.current != null) {
      clearTimeout(scrollIdleTimerRef.current);
    }
    scrollIdleTimerRef.current = setTimeout(() => {
      setListScrolling(false);
      scrollIdleTimerRef.current = null;
    }, SCROLLBAR_IDLE_MS);
  }, []);

  useEffect(() => {
    if (!commandOpen) {
      setListScrolling(false);
      if (scrollIdleTimerRef.current != null) {
        clearTimeout(scrollIdleTimerRef.current);
        scrollIdleTimerRef.current = null;
      }
    }
  }, [commandOpen]);

  useEffect(
    () => () => {
      if (scrollIdleTimerRef.current != null) {
        clearTimeout(scrollIdleTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey) || e.key !== "k") return;
      const target = e.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.closest('[contenteditable="true"]') ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT")
      ) {
        return;
      }
      e.preventDefault();
      setCommandOpen((open) => !open);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [setCommandOpen]);

  const dashboardRoute = getRoute("dashboard");
  const exhibitionRoute = getRoute("exhibition");
  const creatorsRoute = getRoute("creators");
  const communityRoute = getRoute("community");
  const CreatorsCmdIcon = creatorsRoute.icon;
  const CommunityCmdIcon = communityRoute.icon;
  const favoritesRoute = getRoute("favorites");
  const feedRoute = getRoute("feed");
  const adminRoute = getRoute("admin");
  const AdministrationCmdIcon = adminRoute.icon;
  const aboutRoute = getRoute("about");

  const creatorBase =
    user?.id != null ? getCreatorUrl({ id: user.id, slug: user.slug }) : null;

  const go = (href: string) => {
    setCommandOpen(false);
    router.push(href);
  };

  const openSubmit = () => {
    setCommandOpen(false);
    if (user?.id) setCreateSubmissionOpen(true);
  };

  return (
    <Dialog open={commandOpen} onOpenChange={setCommandOpen}>
      <DialogContent
        showClose={false}
        className="max-w-lg gap-0 overflow-hidden rounded-2xl border border-outline-variant/30 bg-popover p-4 text-popover-foreground shadow-2xl sm:max-w-xl"
      >
        <VisuallyHidden>
          <DialogTitle>{tNav("searchEverything")}</DialogTitle>
        </VisuallyHidden>
        <Command
          className={cn(
            "border-0 bg-transparent shadow-none",
            "[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-2 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
          )}
          shouldFilter
          loop
        >
          <div className="border-b border-outline-variant/40 pb-3">
            <CommandInput placeholder={tNav("searchEverything")} />
          </div>
          <CommandList
            className={cn(
              "command-palette-list max-h-[min(420px,50vh)] px-0 pb-1 pt-2",
              listScrolling && "command-palette-list--scrolling",
            )}
            onScroll={handleCommandListScroll}
          >
            <CommandEmpty className="py-8 text-center text-sm text-muted-foreground">
              {tNav("searchEverythingEmpty")}
            </CommandEmpty>
            {user?.id != null && (
              <CommandGroup heading={tNav("myHub")}>
                <CommandItem
                  className={COMMAND_ITEM_CLASS}
                  value={`${tNav("create")} submit`}
                  onSelect={openSubmit}
                >
                  <Plus className={COMMAND_ICON_CLASS} />
                  {tNav("create")}
                </CommandItem>
                <CommandItem
                  className={COMMAND_ITEM_CLASS}
                  value={`${tNav("dashboard")} dashboard`}
                  onSelect={() => go(dashboardRoute.path)}
                >
                  <LayoutDashboard className={COMMAND_ICON_CLASS} />
                  {tNav("dashboard")}
                </CommandItem>
                {creatorBase != null && (
                  <>
                    <CommandItem
                      className={COMMAND_ITEM_CLASS}
                      value={`${tCreator("profile")} profile`}
                      onSelect={() => go(creatorBase)}
                    >
                      <User className={COMMAND_ICON_CLASS} />
                      {tCreator("profile")}
                    </CommandItem>
                    <CommandItem
                      className={COMMAND_ITEM_CLASS}
                      value={`${tCreator("portfolio")} portfolio`}
                      onSelect={() => go(`${creatorBase}/portfolio`)}
                    >
                      <Briefcase className={COMMAND_ICON_CLASS} />
                      {tCreator("portfolio")}
                    </CommandItem>
                    <CommandItem
                      className={COMMAND_ITEM_CLASS}
                      value={`${tCreator("collections")} collections`}
                      onSelect={() => go(`${creatorBase}/collections`)}
                    >
                      <FolderOpen className={COMMAND_ICON_CLASS} />
                      {tCreator("collections")}
                    </CommandItem>
                  </>
                )}
              </CommandGroup>
            )}
            <CommandGroup heading={tNav("inspire")} className="mt-3">
              <CommandItem
                className={COMMAND_ITEM_CLASS}
                value={`${tNav("feed")} feed home`}
                onSelect={() => go(feedRoute.path)}
              >
                <Rss className={COMMAND_ICON_CLASS} />
                {tNav("feed")}
              </CommandItem>
              <CommandItem
                className={COMMAND_ITEM_CLASS}
                value={`${tNav("exhibits")} exhibition`}
                onSelect={() => go(exhibitionRoute.path)}
              >
                <LayoutGrid className={COMMAND_ICON_CLASS} />
                {tNav("exhibits")}
              </CommandItem>
              <CommandItem
                className={COMMAND_ITEM_CLASS}
                value={`${tNav("creators")} creators`}
                onSelect={() => go(CREATORS_INSPIRE_PATH)}
              >
                {CreatorsCmdIcon && (
                  <CreatorsCmdIcon className={COMMAND_ICON_CLASS} />
                )}
                {tNav("creators")}
              </CommandItem>
              <CommandItem
                className={COMMAND_ITEM_CLASS}
                value={`${tNav("community")} community`}
                onSelect={() => go(communityRoute.path)}
              >
                {CommunityCmdIcon && (
                  <CommunityCmdIcon className={COMMAND_ICON_CLASS} />
                )}
                {tNav("community")}
              </CommandItem>
              {user?.id != null && (
                <CommandItem
                  className={COMMAND_ITEM_CLASS}
                  value={`${tNav("favorites")} favorites`}
                  onSelect={() => go(favoritesRoute.path)}
                >
                  <Heart className={COMMAND_ICON_CLASS} />
                  {tNav("favorites")}
                </CommandItem>
              )}
            </CommandGroup>
            {user?.isAdmin === true && AdministrationCmdIcon && (
              <CommandGroup heading={tNav("administration")} className="mt-3">
                <CommandItem
                  className={COMMAND_ITEM_CLASS}
                  value={`${tNav("administration")} admin`}
                  onSelect={() => go(adminRoute.path)}
                >
                  <AdministrationCmdIcon className={COMMAND_ICON_CLASS} />
                  {tNav("administration")}
                </CommandItem>
              </CommandGroup>
            )}
            <CommandGroup heading={tNav("more")} className="mt-3">
              <CommandItem
                className={COMMAND_ITEM_CLASS}
                value={`${tNav("aboutButton")} about`}
                onSelect={() => go(aboutRoute.path)}
              >
                <Info className={COMMAND_ICON_CLASS} />
                {tNav("aboutButton")}
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
