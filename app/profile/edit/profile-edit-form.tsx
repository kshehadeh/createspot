"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RichTextEditor } from "@/components/rich-text-editor";
import { TextThumbnail } from "@/components/text-thumbnail";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Country, State, City } from "country-state-city";
import { Briefcase, ArrowRight } from "lucide-react";
import { normalizeUrl, isValidUrl } from "@/lib/utils";

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
  shareStatus?: "PRIVATE" | "PROFILE" | "PUBLIC";
}

interface ProfileEditFormProps {
  initialName: string;
  initialGoogleName: string;
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
  portfolioItemCount: number;
}

export function ProfileEditForm({
  initialName,
  initialGoogleName,
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
  portfolioItemCount,
}: ProfileEditFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName || initialGoogleName || "");
  const [bio, setBio] = useState(initialBio);
  const [bioHasFocus, setBioHasFocus] = useState(false);
  const [bioOriginalValue, setBioOriginalValue] = useState(initialBio);
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
  const [websiteError, setWebsiteError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Track initial values to detect changes
  const initialValuesRef = useRef({
    name: initialName || initialGoogleName || "",
    bio: initialBio,
    instagram: initialInstagram,
    twitter: initialTwitter,
    linkedin: initialLinkedin,
    website: initialWebsite,
    city: initialCity,
    stateProvince: initialStateProvince,
    country: initialCountry,
    featuredSubmissionId: initialFeaturedSubmissionId,
  });

  // Debounce timer ref
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Auto-save function (excludes bio which is handled separately)
  const saveProfile = useCallback(
    async (
      showToast = true,
      overrides?: {
        name?: string;
        featuredSubmissionId?: string;
        instagram?: string;
        twitter?: string;
        linkedin?: string;
        website?: string;
        city?: string;
        stateProvince?: string;
        country?: string;
      },
    ) => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }

      if (showToast) {
        setSaving(true);
      }
      setError(null);

      const toastId = showToast ? toast.loading("Saving...") : undefined;

      // Use override values if provided, otherwise use current state
      const nameValue = overrides?.name !== undefined ? overrides.name : name;
      const featuredId =
        overrides?.featuredSubmissionId !== undefined
          ? overrides.featuredSubmissionId
          : featuredSubmissionId;
      const instagramValue =
        overrides?.instagram !== undefined ? overrides.instagram : instagram;
      const twitterValue =
        overrides?.twitter !== undefined ? overrides.twitter : twitter;
      const linkedinValue =
        overrides?.linkedin !== undefined ? overrides.linkedin : linkedin;
      const websiteValue =
        overrides?.website !== undefined ? overrides.website : website;
      const cityValue = overrides?.city !== undefined ? overrides.city : city;
      const stateProvinceValue =
        overrides?.stateProvince !== undefined
          ? overrides.stateProvince
          : stateProvince;
      const countryValue =
        overrides?.country !== undefined ? overrides.country : country;

      try {
        const response = await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: nameValue || null,
            bio: initialValuesRef.current.bio || null, // Use saved bio value, not current
            instagram: instagramValue || null,
            twitter: twitterValue || null,
            linkedin: linkedinValue || null,
            website: websiteValue || null,
            city: cityValue || null,
            stateProvince: stateProvinceValue || null,
            country: countryValue || null,
            featuredSubmissionId: featuredId || null,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to save profile");
        }

        if (showToast && toastId) {
          toast.success("Profile saved", { id: toastId });
        }

        // Update initial values ref to track new baseline (excluding bio)
        initialValuesRef.current = {
          ...initialValuesRef.current,
          name: nameValue,
          instagram: instagramValue,
          twitter: twitterValue,
          linkedin: linkedinValue,
          website: websiteValue,
          city: cityValue,
          stateProvince: stateProvinceValue,
          country: countryValue,
          featuredSubmissionId: featuredId,
        };

        router.refresh();
      } catch {
        if (showToast && toastId) {
          toast.error("Failed to save profile. Please try again.", {
            id: toastId,
          });
          setError("Failed to save profile. Please try again.");
        }
      } finally {
        if (showToast) {
          setSaving(false);
        }
      }
    },
    [
      name,
      instagram,
      twitter,
      linkedin,
      website,
      city,
      stateProvince,
      country,
      featuredSubmissionId,
      router,
    ],
  );

  // Debounced auto-save - only saves if there are actual changes
  const debouncedSave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      // Check if there are actual changes before saving (excluding location fields)
      const hasActualChanges =
        name !== initialValuesRef.current.name ||
        instagram !== initialValuesRef.current.instagram ||
        twitter !== initialValuesRef.current.twitter ||
        linkedin !== initialValuesRef.current.linkedin ||
        website !== initialValuesRef.current.website ||
        featuredSubmissionId !== initialValuesRef.current.featuredSubmissionId;

      if (hasActualChanges) {
        saveProfile(true, {
          name,
          instagram,
          twitter,
          linkedin,
          website,
          featuredSubmissionId,
        });
      }
    }, 500);
  }, [
    name,
    instagram,
    twitter,
    linkedin,
    website,
    featuredSubmissionId,
    saveProfile,
  ]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  // Bio handlers - manual save/cancel
  const handleBioChange = useCallback((value: string) => {
    setBio(value);
  }, []);

  const handleBioFocus = useCallback(() => {
    setBioHasFocus(true);
    setBioOriginalValue(bio);
  }, [bio]);

  const handleBioBlur = useCallback(() => {
    // Don't hide buttons on blur - let user decide to save or cancel
  }, []);

  const handleBioSave = useCallback(async () => {
    setBioHasFocus(false);
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    setSaving(true);
    setError(null);

    const toastId = toast.loading("Saving bio...");

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || null,
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

      toast.success("Bio saved", { id: toastId });

      initialValuesRef.current.bio = bio;
      setBioOriginalValue(bio);

      router.refresh();
    } catch {
      toast.error("Failed to save bio. Please try again.", { id: toastId });
      setError("Failed to save bio. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [
    name,
    bio,
    instagram,
    twitter,
    linkedin,
    website,
    city,
    stateProvince,
    country,
    featuredSubmissionId,
    router,
  ]);

  const handleBioCancel = useCallback(() => {
    setBio(bioOriginalValue);
    setBioHasFocus(false);
  }, [bioOriginalValue]);

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setName(e.target.value);
      debouncedSave();
    },
    [debouncedSave],
  );

  const handleNameBlur = useCallback(() => {
    if (name !== initialValuesRef.current.name) {
      saveProfile(true, { name });
    }
  }, [name, saveProfile]);

  const handleInstagramChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInstagram(e.target.value);
      debouncedSave();
    },
    [debouncedSave],
  );

  const handleInstagramBlur = useCallback(() => {
    if (instagram !== initialValuesRef.current.instagram) {
      saveProfile(true, { instagram });
    }
  }, [instagram, saveProfile]);

  const handleTwitterChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setTwitter(e.target.value);
      debouncedSave();
    },
    [debouncedSave],
  );

  const handleTwitterBlur = useCallback(() => {
    if (twitter !== initialValuesRef.current.twitter) {
      saveProfile(true, { twitter });
    }
  }, [twitter, saveProfile]);

  const handleLinkedinChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setLinkedin(e.target.value);
      debouncedSave();
    },
    [debouncedSave],
  );

  const handleLinkedinBlur = useCallback(() => {
    if (linkedin !== initialValuesRef.current.linkedin) {
      saveProfile(true, { linkedin });
    }
  }, [linkedin, saveProfile]);

  const handleWebsiteChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setWebsite(value);
      // Clear error when user starts typing
      if (websiteError) {
        setWebsiteError(null);
      }
      debouncedSave();
    },
    [debouncedSave, websiteError],
  );

  const handleWebsiteBlur = useCallback(() => {
    const trimmed = website.trim();
    
    // If empty, clear and save
    if (!trimmed) {
      setWebsite("");
      setWebsiteError(null);
      if (initialValuesRef.current.website !== "") {
        saveProfile(true, { website: "" });
      }
      return;
    }
    
    // Auto-prepend https:// if no protocol
    const normalized = normalizeUrl(trimmed);
    
    // Validate URL
    if (!normalized || !isValidUrl(normalized)) {
      setWebsiteError("Please enter a valid URL (e.g., example.com or https://example.com)");
      return;
    }
    
    // Update website with normalized URL if it changed
    if (normalized !== trimmed) {
      setWebsite(normalized);
    }
    
    setWebsiteError(null);
    
    // Save if changed
    const finalValue = normalized || "";
    if (finalValue !== initialValuesRef.current.website) {
      saveProfile(true, { website: finalValue });
    }
  }, [website, saveProfile]);

  const handleCityChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setCity(e.target.value);
    },
    [],
  );

  const handleCityBlur = useCallback(() => {
    if (city !== initialValuesRef.current.city) {
      saveProfile(true, {
        country,
        stateProvince,
        city,
      });
    }
  }, [city, country, stateProvince, saveProfile]);

  const handleCountryChange = useCallback((value: string) => {
    setCountry(value);
  }, []);

  const handleStateProvinceChange = useCallback((value: string) => {
    setStateProvince(value);
  }, []);

  const handleCitySelectChange = useCallback(
    (value: string) => {
      setCity(value);
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      if (value !== initialValuesRef.current.city) {
        saveProfile(true, {
          country,
          stateProvince,
          city: value,
        });
      }
    },
    [country, stateProvince, saveProfile],
  );

  const handleFeaturedSubmissionChange = useCallback(
    (id: string) => {
      setFeaturedSubmissionId(id);
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      if (id !== initialValuesRef.current.featuredSubmissionId) {
        saveProfile(true, { featuredSubmissionId: id });
      }
    },
    [saveProfile],
  );

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

      <div className="space-y-6">
        {/* Portfolio Link Card */}
        <Link
          href="/portfolio/edit"
          className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground">
                Manage Portfolio
              </h3>
              <p className="text-xs text-muted-foreground">
                Add, edit, and organize your portfolio items
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {portfolioItemCount > 0 && (
              <Badge variant="secondary">{portfolioItemCount}</Badge>
            )}
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </Link>

        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-sm font-medium text-foreground"
          >
            Name
          </label>
          <Input
            type="text"
            id="name"
            value={name}
            onChange={handleNameChange}
            onBlur={handleNameBlur}
            placeholder="Your name"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            Bio
          </label>
          <RichTextEditor
            value={bio}
            onChange={handleBioChange}
            onFocus={handleBioFocus}
            onBlur={handleBioBlur}
            placeholder="Tell us about yourself..."
          />
          {bioHasFocus && (
            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleBioSave}
                disabled={saving || bio === bioOriginalValue}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleBioCancel}
                disabled={saving}
              >
                Cancel
              </Button>
              {bio !== bioOriginalValue && (
                <span className="flex items-center text-xs text-muted-foreground">
                  Unsaved changes
                </span>
              )}
            </div>
          )}
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
                    return <span className="text-muted-foreground">None</span>;
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
                        handleFeaturedSubmissionChange("");
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
                      const isSelected = featuredSubmissionId === submission.id;
                      return (
                        <button
                          key={submission.id}
                          type="button"
                          onClick={() => {
                            handleFeaturedSubmissionChange(submission.id);
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
                onChange={handleInstagramChange}
                onBlur={handleInstagramBlur}
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
                onChange={handleTwitterChange}
                onBlur={handleTwitterBlur}
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
                onChange={handleLinkedinChange}
                onBlur={handleLinkedinBlur}
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
              onChange={handleWebsiteChange}
              onBlur={handleWebsiteBlur}
              placeholder="https://example.com"
              className={websiteError ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {websiteError && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {websiteError}
              </p>
            )}
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
              <Select value={country} onValueChange={handleCountryChange}>
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
                  onValueChange={handleStateProvinceChange}
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
                  onValueChange={handleCitySelectChange}
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
                  onChange={handleCityChange}
                  onBlur={handleCityBlur}
                  placeholder="Enter city"
                  disabled={
                    !country || (availableStates.length > 0 && !stateProvince)
                  }
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
