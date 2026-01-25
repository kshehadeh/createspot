"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { buildRoutePath } from "@/lib/routes";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { TutorialManager } from "@/lib/tutorial-manager";
import { Country, State, City } from "country-state-city";
import {
  Briefcase,
  ArrowRight,
  Trash2,
  Globe,
  Shield,
  AlertTriangle,
  Mail,
} from "lucide-react";
import { normalizeUrl, isValidUrl } from "@/lib/utils";
import { DeleteAccountModal } from "@/components/delete-account-modal";
import { ConfirmModal } from "@/components/confirm-modal";
import { locales, localeNames, type Locale } from "@/i18n/config";

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
  initialLanguage: string;
  initialFeaturedSubmissionId: string;
  // Image protection settings
  initialEnableWatermark: boolean;
  initialWatermarkPosition: string;
  initialProtectFromDownload: boolean;
  initialProtectFromAI: boolean;
  initialEmailOnFavorite: boolean;
  initialEmailFeatureUpdates: boolean;
  initialEmailOnBadgeAward: boolean;
  submissions: SubmissionOption[];
  portfolioItemCount: number;
  tutorial?: any;
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
  initialLanguage,
  initialFeaturedSubmissionId,
  initialEnableWatermark,
  initialWatermarkPosition,
  initialProtectFromDownload,
  initialProtectFromAI,
  initialEmailOnFavorite,
  initialEmailFeatureUpdates,
  initialEmailOnBadgeAward,
  submissions,
  portfolioItemCount,
  tutorial,
}: ProfileEditFormProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
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
  const [language, setLanguage] = useState(initialLanguage || "en");
  const [featuredSubmissionId, setFeaturedSubmissionId] = useState(
    initialFeaturedSubmissionId,
  );
  // Image protection settings
  const [enableWatermark, setEnableWatermark] = useState(
    initialEnableWatermark,
  );
  const [watermarkPosition, setWatermarkPosition] = useState(
    initialWatermarkPosition,
  );
  const [protectFromDownload, setProtectFromDownload] = useState(
    initialProtectFromDownload,
  );
  const [protectFromAI, setProtectFromAI] = useState(initialProtectFromAI);
  const [emailOnFavorite, setEmailOnFavorite] = useState(
    initialEmailOnFavorite,
  );
  const [emailFeatureUpdates, setEmailFeatureUpdates] = useState(
    initialEmailFeatureUpdates,
  );
  const [emailOnBadgeAward, setEmailOnBadgeAward] = useState(
    initialEmailOnBadgeAward,
  );

  // Tutorial state
  const tutorialManager = new TutorialManager(tutorial);
  const [tutorialsEnabled, setTutorialsEnabled] = useState(
    tutorialManager.isEnabled(),
  );
  const [tutorialUpdating, setTutorialUpdating] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [websiteError, setWebsiteError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isResetTutorialModalOpen, setIsResetTutorialModalOpen] =
    useState(false);
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

  // Ref to hold current form state values (for stable saveProfile callback)
  const formStateRef = useRef({
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

      const toastId = showToast ? toast.loading(tCommon("saving")) : undefined;

      // Use override values if provided, otherwise use current state from ref
      const nameValue =
        overrides?.name !== undefined
          ? overrides.name
          : formStateRef.current.name;
      const featuredId =
        overrides?.featuredSubmissionId !== undefined
          ? overrides.featuredSubmissionId
          : formStateRef.current.featuredSubmissionId;
      const instagramValue =
        overrides?.instagram !== undefined
          ? overrides.instagram
          : formStateRef.current.instagram;
      const twitterValue =
        overrides?.twitter !== undefined
          ? overrides.twitter
          : formStateRef.current.twitter;
      const linkedinValue =
        overrides?.linkedin !== undefined
          ? overrides.linkedin
          : formStateRef.current.linkedin;
      const websiteValue =
        overrides?.website !== undefined
          ? overrides.website
          : formStateRef.current.website;
      const cityValue =
        overrides?.city !== undefined
          ? overrides.city
          : formStateRef.current.city;
      const stateProvinceValue =
        overrides?.stateProvince !== undefined
          ? overrides.stateProvince
          : formStateRef.current.stateProvince;
      const countryValue =
        overrides?.country !== undefined
          ? overrides.country
          : formStateRef.current.country;

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
          toast.success(t("profileSaved"), { id: toastId });
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
          toast.error(t("profileSaveFailed"), {
            id: toastId,
          });
          setError(t("profileSaveFailed"));
        }
      } finally {
        if (showToast) {
          setSaving(false);
        }
      }
    },
    [router, t, tCommon],
  );

  // Sync formStateRef with current state values
  useEffect(() => {
    formStateRef.current = {
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
    };
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

    const toastId = toast.loading(t("savingBio"));

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formStateRef.current.name || null,
          bio: formStateRef.current.bio || null,
          instagram: formStateRef.current.instagram || null,
          twitter: formStateRef.current.twitter || null,
          linkedin: formStateRef.current.linkedin || null,
          website: formStateRef.current.website || null,
          city: formStateRef.current.city || null,
          stateProvince: formStateRef.current.stateProvince || null,
          country: formStateRef.current.country || null,
          featuredSubmissionId:
            formStateRef.current.featuredSubmissionId || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save profile");
      }

      toast.success(t("bioSaved"), { id: toastId });

      initialValuesRef.current.bio = formStateRef.current.bio;
      setBioOriginalValue(formStateRef.current.bio);

      router.refresh();
    } catch {
      toast.error(t("bioSaveFailed"), { id: toastId });
      setError(t("bioSaveFailed"));
    } finally {
      setSaving(false);
    }
  }, [router, t]);

  const handleBioCancel = useCallback(() => {
    setBio(bioOriginalValue);
    setBioHasFocus(false);
  }, [bioOriginalValue]);

  // Tutorial handlers
  const handleTutorialToggle = async (enabled: boolean) => {
    setTutorialUpdating(true);
    try {
      const response = await fetch("/api/tutorial", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: enabled ? "enable" : "disable" }),
      });

      if (!response.ok) {
        throw new Error("Failed to update tutorial settings");
      }

      setTutorialsEnabled(enabled);
      toast.success(enabled ? t("tutorialsEnabled") : t("tutorialsDisabled"));
      router.refresh();
    } catch {
      toast.error(t("tutorialsUpdateError"));
    } finally {
      setTutorialUpdating(false);
    }
  };

  const handleResetTutorials = () => {
    setIsResetTutorialModalOpen(true);
  };

  const performResetTutorials = async () => {
    setIsResetTutorialModalOpen(false);
    setTutorialUpdating(true);
    try {
      const response = await fetch("/api/tutorial", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });

      if (!response.ok) {
        throw new Error("Failed to reset tutorials");
      }

      setTutorialsEnabled(true);
      toast.success(t("tutorialsReset"));
      router.refresh();
    } catch {
      toast.error(t("tutorialsResetError"));
    } finally {
      setTutorialUpdating(false);
    }
  };

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setName(e.target.value);
    },
    [],
  );

  const handleNameBlur = useCallback(() => {
    if (name !== initialValuesRef.current.name) {
      saveProfile(true, { name });
    }
  }, [name, saveProfile]);

  const handleInstagramChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInstagram(e.target.value);
    },
    [],
  );

  const handleInstagramBlur = useCallback(() => {
    if (instagram !== initialValuesRef.current.instagram) {
      saveProfile(true, { instagram });
    }
  }, [instagram, saveProfile]);

  const handleTwitterChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setTwitter(e.target.value);
    },
    [],
  );

  const handleTwitterBlur = useCallback(() => {
    if (twitter !== initialValuesRef.current.twitter) {
      saveProfile(true, { twitter });
    }
  }, [twitter, saveProfile]);

  const handleLinkedinChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setLinkedin(e.target.value);
    },
    [],
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
    },
    [websiteError],
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
      setWebsiteError(t("websiteError"));
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

  const handleCountryChange = useCallback(
    (value: string) => {
      setCountry(value);
      // Save country on change (Select doesn't have blur)
      if (value !== initialValuesRef.current.country) {
        saveProfile(true, {
          country: value,
          stateProvince: "", // Reset state when country changes
          city: "", // Reset city when country changes
        });
        setStateProvince("");
        setCity("");
      }
    },
    [saveProfile],
  );

  const handleStateProvinceChange = useCallback(
    (value: string) => {
      setStateProvince(value);
      // Save state on change (Select doesn't have blur)
      if (value !== initialValuesRef.current.stateProvince) {
        saveProfile(true, {
          country,
          stateProvince: value,
          city: "", // Reset city when state changes
        });
        setCity("");
      }
    },
    [country, saveProfile],
  );

  const handleCitySelectChange = useCallback(
    (value: string) => {
      setCity(value);
      // Save immediately when selecting from dropdown (dropdowns don't have blur)
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

  const handleLanguageChange = useCallback(
    async (newLanguage: string) => {
      if (newLanguage === language) return;

      setLanguage(newLanguage);
      const toastId = toast.loading(tCommon("loading"));

      try {
        const response = await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            language: newLanguage,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update language");
        }

        toast.success(t("languageUpdated"), { id: toastId });

        // Refresh the page to apply the new locale
        window.location.reload();
      } catch {
        toast.error(t("languageUpdateFailed"), {
          id: toastId,
        });
        setLanguage(language); // Revert on error
      }
    },
    [language],
  );

  // Image protection settings handlers
  const saveProtectionSettings = useCallback(
    async (settings: {
      enableWatermark?: boolean;
      watermarkPosition?: string;
      protectFromDownload?: boolean;
      protectFromAI?: boolean;
    }) => {
      const toastId = toast.loading(tCommon("saving"));
      try {
        const response = await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settings),
        });

        if (!response.ok) {
          throw new Error("Failed to save protection settings");
        }

        toast.success(t("protectionSettingsSaved"), { id: toastId });
        router.refresh();
      } catch {
        toast.error(t("protectionSettingsFailed"), { id: toastId });
      }
    },
    [router, t, tCommon],
  );

  const saveEmailPreferences = useCallback(
    async (settings: {
      emailOnFavorite?: boolean;
      emailFeatureUpdates?: boolean;
      emailOnBadgeAward?: boolean;
    }) => {
      const toastId = toast.loading(tCommon("saving"));
      try {
        const response = await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settings),
        });

        if (!response.ok) {
          throw new Error("Failed to save email preferences");
        }

        toast.success(t("emailPreferencesSaved"), { id: toastId });
        router.refresh();
      } catch {
        toast.error(t("emailPreferencesFailed"), { id: toastId });
      }
    },
    [router, t, tCommon],
  );

  const handleEnableWatermarkChange = useCallback(
    (checked: boolean) => {
      setEnableWatermark(checked);
      saveProtectionSettings({ enableWatermark: checked });
    },
    [saveProtectionSettings],
  );

  const handleWatermarkPositionChange = useCallback(
    (value: string) => {
      setWatermarkPosition(value);
      saveProtectionSettings({ watermarkPosition: value });
    },
    [saveProtectionSettings],
  );

  const handleProtectFromDownloadChange = useCallback(
    (checked: boolean) => {
      setProtectFromDownload(checked);
      saveProtectionSettings({ protectFromDownload: checked });
    },
    [saveProtectionSettings],
  );

  const handleProtectFromAIChange = useCallback(
    (checked: boolean) => {
      setProtectFromAI(checked);
      saveProtectionSettings({ protectFromAI: checked });
    },
    [saveProtectionSettings],
  );

  const handleEmailOnFavoriteChange = useCallback(
    (checked: boolean) => {
      setEmailOnFavorite(checked);
      saveEmailPreferences({ emailOnFavorite: checked });
    },
    [saveEmailPreferences],
  );

  const handleEmailFeatureUpdatesChange = useCallback(
    (checked: boolean) => {
      setEmailFeatureUpdates(checked);
      saveEmailPreferences({ emailFeatureUpdates: checked });
    },
    [saveEmailPreferences],
  );

  const handleEmailOnBadgeAwardChange = useCallback(
    (checked: boolean) => {
      setEmailOnBadgeAward(checked);
      saveEmailPreferences({ emailOnBadgeAward: checked });
    },
    [saveEmailPreferences],
  );

  const getSubmissionLabel = (submission: SubmissionOption): string => {
    if (submission.prompt && submission.wordIndex) {
      return [
        submission.prompt.word1,
        submission.prompt.word2,
        submission.prompt.word3,
      ][submission.wordIndex - 1];
    }
    return submission.category || t("portfolioBadge");
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
        {session?.user?.id && (
          <Link
            href={buildRoutePath("portfolioEdit", {
              creatorid: session.user.id,
            })}
            className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Briefcase className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground">
                  {t("managePortfolio")}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t("managePortfolioDescription")}
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
        )}

        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-sm font-medium text-foreground"
          >
            {t("name")}
          </label>
          <Input
            type="text"
            id="name"
            value={name}
            onChange={handleNameChange}
            onBlur={handleNameBlur}
            placeholder={t("namePlaceholder")}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            {t("bio")}
          </label>
          <RichTextEditor
            value={bio}
            onChange={handleBioChange}
            onFocus={handleBioFocus}
            onBlur={handleBioBlur}
            placeholder={t("bioPlaceholder")}
          />
          {bioHasFocus && (
            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleBioSave}
                disabled={saving || bio === bioOriginalValue}
              >
                {saving ? tCommon("saving") : tCommon("save")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleBioCancel}
                disabled={saving}
              >
                {tCommon("cancel")}
              </Button>
              {bio !== bioOriginalValue && (
                <span className="flex items-center text-xs text-muted-foreground">
                  {tCommon("unsavedChanges")}
                </span>
              )}
            </div>
          )}
        </div>

        <div>
          <label
            htmlFor="language"
            className="mb-2 block text-sm font-medium text-foreground"
          >
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {t("language")}
            </div>
          </label>
          <p className="mb-3 text-xs text-muted-foreground">
            {t("languageDescription")}
          </p>
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger id="language" className="w-full sm:w-[200px]">
              <SelectValue placeholder={t("selectLanguage")} />
            </SelectTrigger>
            <SelectContent>
              {locales.map((locale) => (
                <SelectItem key={locale} value={locale}>
                  {localeNames[locale as Locale]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            {t("featuredPiece")}
          </label>
          <p className="mb-3 text-xs text-muted-foreground">
            {t("featuredPieceDescription")}
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
                        {tCommon("none")}
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
                        handleFeaturedSubmissionChange("");
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left transition-colors ${
                        featuredSubmissionId === ""
                          ? "bg-accent text-accent-foreground"
                          : "text-popover-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      <span className="text-sm font-medium">
                        {tCommon("none")}
                      </span>
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
                                    {t("portfolioBadge")}
                                  </Badge>
                                )}
                                {isSelected && (
                                  <span className="text-xs text-muted-foreground">
                                    {t("featured")}
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
            <p className="text-sm text-muted-foreground">{t("noWorkYet")}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="instagram"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              {t("instagram")}
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
                placeholder={t("usernamePlaceholder")}
                className="rounded-l-none rounded-r-lg"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="twitter"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              {t("twitter")}
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
                placeholder={t("usernamePlaceholder")}
                className="rounded-l-none rounded-r-lg"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="linkedin"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              {t("linkedin")}
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
                placeholder={t("usernamePlaceholder")}
                className="rounded-l-none rounded-r-lg"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="website"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              {t("website")}
            </label>
            <Input
              type="url"
              id="website"
              value={website}
              onChange={handleWebsiteChange}
              onBlur={handleWebsiteBlur}
              placeholder={t("websitePlaceholder")}
              className={
                websiteError ? "border-red-500 focus-visible:ring-red-500" : ""
              }
            />
            {websiteError && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {websiteError}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-foreground">
            {t("location")}
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label
                htmlFor="country"
                className="mb-2 block text-sm font-medium text-foreground"
              >
                {t("country")}
              </label>
              <Select value={country} onValueChange={handleCountryChange}>
                <SelectTrigger id="country">
                  <SelectValue placeholder={t("selectCountry")} />
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
                  {t("stateProvince")}
                </label>
                <Select
                  value={stateProvince}
                  onValueChange={handleStateProvinceChange}
                  disabled={!country}
                >
                  <SelectTrigger id="state">
                    <SelectValue
                      placeholder={
                        country ? t("selectState") : t("selectCountryFirst")
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
                  {t("city")}
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
                          ? t("selectCountryFirst")
                          : !stateProvince
                            ? t("selectStateFirst")
                            : t("selectCity")
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
                  {t("city")}
                </label>
                <Input
                  type="text"
                  id="city"
                  value={city}
                  onChange={handleCityChange}
                  onBlur={handleCityBlur}
                  placeholder={t("enterCity")}
                  disabled={
                    !country || (availableStates.length > 0 && !stateProvince)
                  }
                />
              </div>
            )}
          </div>
        </div>

        {/* Email Preferences */}
        <div className="mt-8 border-t border-border pt-8">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Mail className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {t("emailPreferences")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("emailPreferencesDescription")}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
                <div className="flex-1">
                  <label className="text-sm font-medium text-foreground">
                    {t("emailOnFavorite")}
                  </label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("emailOnFavoriteDescription")}
                  </p>
                </div>
                <Switch
                  checked={emailOnFavorite}
                  onCheckedChange={handleEmailOnFavoriteChange}
                />
              </div>

              <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
                <div className="flex-1">
                  <label className="text-sm font-medium text-foreground">
                    {t("emailFeatureUpdates")}
                  </label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("emailFeatureUpdatesDescription")}
                  </p>
                </div>
                <Switch
                  checked={emailFeatureUpdates}
                  onCheckedChange={handleEmailFeatureUpdatesChange}
                />
              </div>

              <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
                <div className="flex-1">
                  <label className="text-sm font-medium text-foreground">
                    {t("emailOnBadgeAward")}
                  </label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("emailOnBadgeAwardDescription")}
                  </p>
                </div>
                <Switch
                  checked={emailOnBadgeAward}
                  onCheckedChange={handleEmailOnBadgeAwardChange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Image Protection Settings */}
        <div className="mt-8 pt-8 border-t border-border">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Shield className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {t("imageProtection")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("imageProtectionDescription")}
                </p>
              </div>
            </div>

            {/* Watermark Setting */}
            <div className="space-y-4 rounded-lg border border-border p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium text-foreground">
                    {t("enableWatermark")}
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("enableWatermarkDescription")}
                  </p>
                </div>
                <Switch
                  checked={enableWatermark}
                  onCheckedChange={handleEnableWatermarkChange}
                />
              </div>

              {enableWatermark && (
                <>
                  {/* Warning Banner */}
                  <div className="flex gap-3 rounded-lg bg-muted border border-border p-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-foreground">
                      <p className="font-medium">
                        {t("watermarkWarningTitle")}
                      </p>
                      <p className="text-xs mt-1 text-muted-foreground">
                        {t("watermarkWarningDescription")}
                      </p>
                    </div>
                  </div>

                  {/* Watermark Position */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">
                      {t("watermarkPosition")}
                    </label>
                    <Select
                      value={watermarkPosition}
                      onValueChange={handleWatermarkPositionChange}
                    >
                      <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder={t("selectPosition")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bottom-right">
                          {t("bottomRight")}
                        </SelectItem>
                        <SelectItem value="bottom-left">
                          {t("bottomLeft")}
                        </SelectItem>
                        <SelectItem value="top-right">
                          {t("topRight")}
                        </SelectItem>
                        <SelectItem value="top-left">{t("topLeft")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>

            {/* Download Protection */}
            <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-foreground">
                  {t("preventDownloads")}
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("preventDownloadsDescription")}
                </p>
              </div>
              <Switch
                checked={protectFromDownload}
                onCheckedChange={handleProtectFromDownloadChange}
              />
            </div>

            {/* AI Training Protection */}
            <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-foreground">
                  {t("preventAITraining")}
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("preventAITrainingDescription")}
                </p>
              </div>
              <Switch
                checked={protectFromAI}
                onCheckedChange={handleProtectFromAIChange}
              />
            </div>

            {/* Disclaimer */}
            <p className="text-xs text-muted-foreground">
              {t("protectionDisclaimer")}
            </p>
          </div>
        </div>

        {/* Tutorial Settings */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {t("tutorialSettings")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("tutorialSettingsDescription")}
              </p>
            </div>

            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label
                  htmlFor="tutorial-toggle"
                  className="text-sm font-medium"
                >
                  {t("enableTutorials")}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t("enableTutorialsDescription")}
                </p>
              </div>
              <Switch
                id="tutorial-toggle"
                checked={tutorialsEnabled}
                onCheckedChange={handleTutorialToggle}
                disabled={tutorialUpdating}
              />
            </div>

            {/* Reset Button */}
            <div className="flex items-center justify-between border-t border-border pt-4">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">
                  {t("resetTutorials")}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t("resetTutorialsDescription")}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetTutorials}
                disabled={tutorialUpdating}
              >
                {t("resetTutorials")}
              </Button>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="mt-12 pt-8 border-t border-destructive/20">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-destructive">
                {t("dangerZone")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("dangerZoneDescription")}
              </p>
            </div>
            <Button
              type="button"
              variant="destructive"
              onClick={() => setIsDeleteModalOpen(true)}
              className="w-full sm:w-auto"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t("deleteAccount")}
            </Button>
          </div>
        </div>
      </div>

      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      />

      <ConfirmModal
        isOpen={isResetTutorialModalOpen}
        title={t("resetTutorials")}
        message={t("resetTutorialsDescription")}
        confirmLabel={t("resetTutorials")}
        onConfirm={performResetTutorials}
        onCancel={() => setIsResetTutorialModalOpen(false)}
        isLoading={tutorialUpdating}
      />
    </div>
  );
}
