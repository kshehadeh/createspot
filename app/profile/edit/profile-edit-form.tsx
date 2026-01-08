"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { RichTextEditor } from "@/components/rich-text-editor";
import { TextThumbnail } from "@/components/text-thumbnail";
import { PortfolioItemForm } from "@/components/portfolio-item-form";
import { ConfirmModal } from "@/components/confirm-modal";
import { PortfolioGrid } from "@/components/portfolio-grid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Country, State, City } from "country-state-city";

interface SubmissionOption {
  id: string;
  title: string | null;
  imageUrl: string | null;
  text: string | null;
  wordIndex: number | null;
  isPortfolio: boolean;
  tags: string[];
  category: string | null;
  prompt: {
    word1: string;
    word2: string;
    word3: string;
  } | null;
}

interface PortfolioItem {
  id: string;
  title: string | null;
  imageUrl: string | null;
  text: string | null;
  isPortfolio: boolean;
  portfolioOrder: number | null;
  tags: string[];
  category: string | null;
  promptId: string | null;
  wordIndex: number | null;
  prompt: {
    word1: string;
    word2: string;
    word3: string;
  } | null;
  _count: {
    favorites: number;
  };
  shareStatus?: "PRIVATE" | "PROFILE" | "PUBLIC";
}

interface ProfileEditFormProps {
  userId: string;
  initialBio: string;
  initialInstagram: string;
  initialTwitter: string;
  initialLinkedin: string;
  initialWebsite: string;
  initialCity: string;
  initialStateProvince: string;
  initialCountry: string;
  initialFeaturedSubmissionId: string;
  submissions: SubmissionOption[];
  portfolioItems: PortfolioItem[];
}

export function ProfileEditForm({
  userId: _userId,
  initialBio,
  initialInstagram,
  initialTwitter,
  initialLinkedin,
  initialWebsite,
  initialCity,
  initialStateProvince,
  initialCountry,
  initialFeaturedSubmissionId,
  submissions,
  portfolioItems: initialPortfolioItems,
}: ProfileEditFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("profile");
  const [bio, setBio] = useState(initialBio);
  const [instagram, setInstagram] = useState(initialInstagram);
  const [twitter, setTwitter] = useState(initialTwitter);
  const [linkedin, setLinkedin] = useState(initialLinkedin);
  const [website, setWebsite] = useState(initialWebsite);
  const [city, setCity] = useState(initialCity);
  const [stateProvince, setStateProvince] = useState(initialStateProvince);
  const [country, setCountry] = useState(initialCountry);
  const [featuredSubmissionId, setFeaturedSubmissionId] = useState(
    initialFeaturedSubmissionId,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Portfolio state
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>(
    initialPortfolioItems,
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<PortfolioItem | null>(null);

  // Check for hash or query parameter to auto-switch to portfolio tab
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    const hasPortfolioHash = typeof window !== "undefined" && window.location.hash === "#portfolio";

    if (tabParam === "portfolio" || hasPortfolioHash) {
      setActiveTab("portfolio");
    }
  }, [searchParams]);

  // Get available states/provinces for selected country
  const availableStates = useMemo(
    () => (country ? State.getStatesOfCountry(country) : []),
    [country],
  );

  // Get available cities for selected country and state
  const availableCities = useMemo(
    () =>
      country && stateProvince
        ? City.getCitiesOfState(country, stateProvince)
        : [],
    [country, stateProvince],
  );

  // Reset state when country changes
  useEffect(() => {
    if (country) {
      const isValidState = availableStates.some(
        (s) => s.isoCode === stateProvince,
      );
      if (stateProvince && !isValidState) {
        setStateProvince("");
        setCity("");
      }
    } else if (stateProvince) {
      setStateProvince("");
      setCity("");
    }
  }, [country, stateProvince, availableStates]);

  // Reset city when state changes
  useEffect(() => {
    if (stateProvince && availableCities.length > 0) {
      const isValidCity = availableCities.some((c) => c.name === city);
      if (city && !isValidCity) {
        setCity("");
      }
    } else if (stateProvince && !country) {
      setCity("");
    }
  }, [stateProvince, city, availableCities, country]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const newUrl = new URL(window.location.href);
    if (value === "portfolio") {
      newUrl.searchParams.set("tab", "portfolio");
    } else {
      newUrl.searchParams.delete("tab");
    }
    newUrl.hash = "";
    window.history.replaceState({}, "", newUrl.toString());
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: bio || null,
          instagram: instagram || null,
          twitter: twitter || null,
          linkedin: linkedin || null,
          website: website || null,
          city: city || null,
          stateProvince: stateProvince || null,
          country: country || null,
          featuredSubmissionId: featuredSubmissionId || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save profile");
      }

      router.push(`/profile/${(await response.json()).user.id}`);
      router.refresh();
    } catch {
      setError("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePortfolioItem = async (item: PortfolioItem) => {
    try {
      const response = await fetch(`/api/submissions/${item.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete");
      }

      setPortfolioItems((prev) => prev.filter((p) => p.id !== item.id));
      setDeletingItem(null);
      router.refresh();
    } catch {
      setError("Failed to delete portfolio item. Please try again.");
    }
  };

  const handleEditPortfolioItem = (item: PortfolioItem) => {
    setEditingItem(item);
  };

  const handleDeletePortfolioItemFromGrid = async (item: PortfolioItem) => {
    await handleDeletePortfolioItem(item);
  };

  const handleTogglePortfolio = async (
    submission: SubmissionOption,
    addToPortfolio: boolean,
  ) => {
    try {
      const response = await fetch(`/api/submissions/${submission.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isPortfolio: addToPortfolio,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update");
      }

      if (addToPortfolio) {
        setPortfolioItems((prev) => [
          ...prev,
          {
            id: submission.id,
            title: submission.title,
            imageUrl: submission.imageUrl,
            text: submission.text,
            isPortfolio: true,
            portfolioOrder: null,
            tags: submission.tags,
            category: submission.category,
            promptId: null,
            wordIndex: submission.wordIndex,
            prompt: submission.prompt,
            _count: { favorites: 0 },
          },
        ]);
      } else {
        setPortfolioItems((prev) => prev.filter((p) => p.id !== submission.id));
      }

      router.refresh();
    } catch {
      setError("Failed to update portfolio. Please try again.");
    }
  };

  const getSubmissionLabel = (submission: SubmissionOption): string => {
    if (submission.prompt && submission.wordIndex) {
      return [
        submission.prompt.word1,
        submission.prompt.word2,
        submission.prompt.word3,
      ][submission.wordIndex - 1];
    }
    return submission.category || "Portfolio";
  };

  return (
    <div>
      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="mb-6 w-full justify-start border-b border-border bg-transparent p-0">
          <TabsTrigger
            value="profile"
            className="rounded-none border-b-2 border-transparent pb-3 data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Profile
          </TabsTrigger>
          <TabsTrigger
            value="portfolio"
            className="rounded-none border-b-2 border-transparent pb-3 data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Portfolio
            {portfolioItems.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {portfolioItems.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-0">
          <div className="w-full">
          <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Bio
            </label>
            <RichTextEditor
              value={bio}
              onChange={setBio}
              placeholder="Tell us about yourself..."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Featured Piece
            </label>
            <p className="mb-3 text-xs text-muted-foreground">
              Select a work to feature on your profile
            </p>
            {submissions.length > 0 ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex w-full items-center justify-between rounded-lg border border-input bg-background px-4 py-3 text-left text-foreground transition-colors focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                  aria-expanded={isDropdownOpen}
                  aria-haspopup="listbox"
                >
                  {(() => {
                    const selected = submissions.find(
                      (s) => s.id === featuredSubmissionId,
                    );
                    if (!selected) {
                      return (
                        <span className="text-muted-foreground">
                          None
                        </span>
                      );
                    }
                    const word = getSubmissionLabel(selected);
                    return (
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        {selected.imageUrl ? (
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                            <Image
                              src={selected.imageUrl}
                              alt={selected.title || word}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          </div>
                        ) : selected.text ? (
                          <TextThumbnail
                            text={selected.text}
                            className="h-10 w-10 shrink-0 rounded-lg"
                          />
                        ) : (
                          <div className="h-10 w-10 shrink-0 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground">
                              {word}
                            </span>
                          </div>
                          {selected.title && (
                            <p className="truncate text-sm font-medium text-foreground">
                              {selected.title}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })()}
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
                  <div className="absolute z-50 mt-2 max-h-96 w-full overflow-y-auto rounded-lg border border-border bg-popover shadow-lg">
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setFeaturedSubmissionId("");
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-3 text-left transition-colors ${
                          featuredSubmissionId === ""
                            ? "bg-accent text-accent-foreground"
                            : "text-popover-foreground hover:bg-accent hover:text-accent-foreground"
                        }`}
                      >
                        <span className="text-sm font-medium">None</span>
                      </button>
                      {submissions.map((submission) => {
                        const word = getSubmissionLabel(submission);
                        const isSelected =
                          featuredSubmissionId === submission.id;
                        return (
                          <button
                            key={submission.id}
                            type="button"
                            onClick={() => {
                              setFeaturedSubmissionId(submission.id);
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full px-4 py-3 text-left transition-colors ${
                              isSelected
                                ? "bg-accent text-accent-foreground"
                                : "text-popover-foreground hover:bg-accent hover:text-accent-foreground"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {submission.imageUrl ? (
                                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                                  <Image
                                    src={submission.imageUrl}
                                    alt={submission.title || word}
                                    fill
                                    className="object-cover"
                                    sizes="48px"
                                  />
                                </div>
                              ) : submission.text ? (
                                <TextThumbnail
                                  text={submission.text}
                                  className="h-12 w-12 shrink-0 rounded-lg"
                                />
                              ) : (
                                <div className="h-12 w-12 shrink-0 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                    {word}
                                  </span>
                                  {submission.isPortfolio && (
                                    <Badge className="bg-prompt/15 text-prompt-foreground hover:bg-prompt/25">
                                      Portfolio
                                    </Badge>
                                  )}
                                  {isSelected && (
                                    <span className="text-xs text-muted-foreground">
                                      (Featured)
                                    </span>
                                  )}
                                </div>
                                {submission.title && (
                                  <p className="truncate text-sm font-medium text-popover-foreground">
                                    {submission.title}
                                  </p>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No work yet. Create a submission or add to your portfolio to
                feature it.
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="instagram"
                className="mb-2 block text-sm font-medium text-foreground"
              >
                Instagram
              </label>
              <div className="flex">
                <span className="inline-flex items-center rounded-l-lg border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                  @
                </span>
                <Input
                  type="text"
                  id="instagram"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="username"
                  className="rounded-l-none rounded-r-lg"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="twitter"
                className="mb-2 block text-sm font-medium text-foreground"
              >
                X (Twitter)
              </label>
              <div className="flex">
                <span className="inline-flex items-center rounded-l-lg border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                  @
                </span>
                <Input
                  type="text"
                  id="twitter"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="username"
                  className="rounded-l-none rounded-r-lg"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="linkedin"
                className="mb-2 block text-sm font-medium text-foreground"
              >
                LinkedIn
              </label>
              <div className="flex">
                <span className="inline-flex items-center rounded-l-lg border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                  in/
                </span>
                <Input
                  type="text"
                  id="linkedin"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="username"
                  className="rounded-l-none rounded-r-lg"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="website"
                className="mb-2 block text-sm font-medium text-foreground"
              >
                Website
              </label>
              <Input
                type="url"
                id="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">Location</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="country"
                  className="mb-2 block text-sm font-medium text-foreground"
                >
                  Country
                </label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger id="country">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent className="!max-h-[60vh]">
                    {Country.getAllCountries().map((c) => (
                      <SelectItem key={c.isoCode} value={c.isoCode}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {availableStates.length > 0 && (
                <div>
                  <label
                    htmlFor="state"
                    className="mb-2 block text-sm font-medium text-foreground"
                  >
                    State/Province
                  </label>
                  <Select
                    value={stateProvince}
                    onValueChange={setStateProvince}
                    disabled={!country}
                  >
                    <SelectTrigger id="state">
                      <SelectValue
                        placeholder={
                          country
                            ? "Select state/province"
                            : "Select country first"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="!max-h-[60vh]">
                      {availableStates.map((s) => (
                        <SelectItem key={s.isoCode} value={s.isoCode}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {availableStates.length > 0 && availableCities.length > 0 && (
                <div>
                  <label
                    htmlFor="city"
                    className="mb-2 block text-sm font-medium text-foreground"
                  >
                    City
                  </label>
                  <Select
                    value={city}
                    onValueChange={setCity}
                    disabled={!country || !stateProvince}
                  >
                    <SelectTrigger id="city">
                      <SelectValue
                        placeholder={
                          !country
                            ? "Select country first"
                            : !stateProvince
                              ? "Select state/province first"
                              : "Select city"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="!max-h-[60vh]">
                      {availableCities.map((c) => (
                        <SelectItem key={c.name} value={c.name}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {((availableStates.length === 0 && country) ||
                (availableStates.length > 0 &&
                  stateProvince &&
                  availableCities.length === 0)) && (
                <div>
                  <label
                    htmlFor="city"
                    className="mb-2 block text-sm font-medium text-foreground"
                  >
                    City
                  </label>
                  <Input
                    type="text"
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Enter city"
                    disabled={!country || (availableStates.length > 0 && !stateProvince)}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Profile"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
          </form>
        </div>
        </TabsContent>

        <TabsContent value="portfolio" className="mt-0">
          <div className="w-full">
          <div className="space-y-6">
          {/* Add New Portfolio Item */}
          {showAddForm ? (
            <Card className="rounded-xl">
              <CardContent className="p-6">
                <h3 className="mb-4 text-lg font-semibold text-foreground">
                  Add Portfolio Item
                </h3>
                <PortfolioItemForm
                  mode="create"
                  onSuccess={() => {
                    setShowAddForm(false);
                    router.refresh();
                  }}
                  onCancel={() => setShowAddForm(false)}
                />
              </CardContent>
            </Card>
          ) : editingItem ? (
            <Card className="rounded-xl">
              <CardContent className="p-6">
                <h3 className="mb-4 text-lg font-semibold text-foreground">
                  Edit Portfolio Item
                </h3>
                <PortfolioItemForm
                  mode="edit"
                  initialData={editingItem}
                  onSuccess={() => {
                    setEditingItem(null);
                    router.refresh();
                  }}
                  onCancel={() => setEditingItem(null)}
                />
              </CardContent>
            </Card>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddForm(true)}
              className="w-full border-2 border-dashed py-8"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add New Portfolio Item
            </Button>
          )}

          {/* Portfolio Items Grid */}
          {portfolioItems.length > 0 && !showAddForm && !editingItem && (
            <div>
              <h3 className="mb-4 text-sm font-medium text-foreground">
                Your Portfolio Items ({portfolioItems.length})
              </h3>
              <PortfolioGrid
                items={portfolioItems}
                isLoggedIn={true}
                isOwnProfile={true}
                showPromptBadge={true}
                allowEdit={true}
                onEdit={handleEditPortfolioItem}
                onDelete={handleDeletePortfolioItemFromGrid}
              />
            </div>
          )}

          {/* Add from Prompt Submissions */}
          {submissions.filter((s) => !s.isPortfolio && s.prompt).length > 0 &&
            !showAddForm &&
            !editingItem && (
              <div>
                <h3 className="mb-4 text-sm font-medium text-foreground">
                  Add Prompt Submissions to Portfolio
                </h3>
                <p className="mb-4 text-xs text-muted-foreground">
                  Your prompt submissions can also be added to your portfolio
                </p>
                <div className="space-y-2">
                  {submissions
                    .filter((s) => !s.isPortfolio && s.prompt)
                    .slice(0, 5)
                    .map((submission) => {
                      const word = getSubmissionLabel(submission);
                      return (
                        <div
                          key={submission.id}
                          className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
                        >
                          {submission.imageUrl ? (
                            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                              <Image
                                src={submission.imageUrl}
                                alt={submission.title || word}
                                fill
                                className="object-cover"
                                sizes="40px"
                              />
                            </div>
                          ) : submission.text ? (
                            <TextThumbnail
                              text={submission.text}
                              className="h-10 w-10 shrink-0 rounded-lg"
                            />
                          ) : (
                            <div className="h-10 w-10 shrink-0 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">
                              {submission.title || word}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {word}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              handleTogglePortfolio(submission, true)
                            }
                            className="shrink-0"
                          >
                            Add to Portfolio
                          </Button>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <ConfirmModal
          isOpen={true}
          title="Delete Portfolio Item"
          message={`Are you sure you want to delete "${deletingItem.title || "this item"}" from your portfolio? This action cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={() => handleDeletePortfolioItem(deletingItem)}
          onCancel={() => setDeletingItem(null)}
        />
      )}
    </div>
  );
}
