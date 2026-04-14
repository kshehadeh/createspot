"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
const SEARCH_DEBOUNCE_MS = 200;
const SEARCH_MIN_CHARS = 2;

interface CommandPaletteSubmissionResult {
  id: string;
  title: string | null;
  imageUrl: string | null;
  shareStatus: "PRIVATE" | "PROFILE" | "PUBLIC";
  user: {
    id: string;
    slug: string | null;
    name: string | null;
  };
}

interface CommandPaletteCreatorResult {
  id: string;
  slug: string | null;
  name: string | null;
  profileImageUrl: string | null;
  image: string | null;
  _count: {
    submissions: number;
  };
}

export function GlobalCommandMenu({ user }: GlobalCommandMenuProps) {
  const router = useRouter();
  const tNav = useTranslations("navigation");
  const tCreator = useTranslations("creatorNav");
  const { commandOpen, setCommandOpen, setCreateSubmissionOpen } =
    useAppChrome();
  const [query, setQuery] = useState("");
  const [submissions, setSubmissions] = useState<
    CommandPaletteSubmissionResult[]
  >([]);
  const [creators, setCreators] = useState<CommandPaletteCreatorResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [listScrolling, setListScrolling] = useState(false);
  const scrollIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightAbortRef = useRef<AbortController | null>(null);

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
      setQuery("");
      setSubmissions([]);
      setCreators([]);
      setIsSearching(false);
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
      if (searchTimerRef.current != null) {
        clearTimeout(searchTimerRef.current);
      }
      if (inFlightAbortRef.current != null) {
        inFlightAbortRef.current.abort();
      }
    },
    [],
  );

  const normalizedQuery = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    if (!commandOpen) return;

    if (searchTimerRef.current != null) {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
    if (inFlightAbortRef.current != null) {
      inFlightAbortRef.current.abort();
      inFlightAbortRef.current = null;
    }

    if (normalizedQuery.length < SEARCH_MIN_CHARS) {
      setSubmissions([]);
      setCreators([]);
      setIsSearching(false);
      return;
    }

    searchTimerRef.current = setTimeout(() => {
      const abortController = new AbortController();
      inFlightAbortRef.current = abortController;
      setIsSearching(true);

      const params = new URLSearchParams({ q: normalizedQuery });

      Promise.all([
        fetch(`/api/command-palette/submissions?${params.toString()}`, {
          signal: abortController.signal,
        })
          .then(async (r) => (r.ok ? r.json() : null))
          .then(
            (data) =>
              (data?.submissions ?? []) as CommandPaletteSubmissionResult[],
          )
          .catch(() => [] as CommandPaletteSubmissionResult[]),
        fetch(`/api/command-palette/creators?${params.toString()}`, {
          signal: abortController.signal,
        })
          .then(async (r) => (r.ok ? r.json() : null))
          .then(
            (data) => (data?.creators ?? []) as CommandPaletteCreatorResult[],
          )
          .catch(() => [] as CommandPaletteCreatorResult[]),
      ])
        .then(([nextSubmissions, nextCreators]) => {
          setSubmissions(nextSubmissions);
          setCreators(nextCreators);
        })
        .finally(() => {
          if (!abortController.signal.aborted) {
            setIsSearching(false);
            inFlightAbortRef.current = null;
          }
        });
    }, SEARCH_DEBOUNCE_MS);
  }, [commandOpen, normalizedQuery]);

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
            <CommandInput
              placeholder={tNav("searchEverything")}
              value={query}
              onValueChange={setQuery}
            />
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
            {isSearching && (
              <CommandGroup heading={tNav("commandPaletteStatus")}>
                <CommandItem
                  className={COMMAND_ITEM_CLASS}
                  value={tNav("commandPaletteLoading")}
                  disabled
                >
                  {tNav("commandPaletteLoading")}
                </CommandItem>
              </CommandGroup>
            )}
            {!isSearching && submissions.length > 0 && (
              <CommandGroup
                heading={tNav("commandPaletteSubmissions")}
                className="mt-3"
              >
                {submissions.map((submission) => {
                  const creatorHref = getCreatorUrl({
                    id: submission.user.id,
                    slug: submission.user.slug,
                  });
                  const title =
                    submission.title?.trim() || tNav("commandPaletteUntitled");

                  return (
                    <CommandItem
                      key={submission.id}
                      className={COMMAND_ITEM_CLASS}
                      value={`${title} ${submission.user.name ?? ""}`.trim()}
                      onSelect={() => go(`${creatorHref}/s/${submission.id}`)}
                    >
                      <LayoutGrid className={COMMAND_ICON_CLASS} />
                      {title}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
            {!isSearching && creators.length > 0 && (
              <CommandGroup
                heading={tNav("commandPaletteCreators")}
                className="mt-3"
              >
                {creators.map((creator) => {
                  const name =
                    creator.name?.trim() || tNav("commandPaletteUnnamed");
                  const countLabel = tNav("commandPaletteCreatorCount", {
                    count: creator._count.submissions,
                  });

                  return (
                    <CommandItem
                      key={creator.id}
                      className={COMMAND_ITEM_CLASS}
                      value={`${name} ${countLabel}`.trim()}
                      onSelect={() =>
                        go(
                          getCreatorUrl({ id: creator.id, slug: creator.slug }),
                        )
                      }
                    >
                      {CreatorsCmdIcon && (
                        <CreatorsCmdIcon className={COMMAND_ICON_CLASS} />
                      )}
                      <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
                        <span className="truncate">{name}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {countLabel}
                        </span>
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
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
