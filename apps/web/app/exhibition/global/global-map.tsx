"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { LOGO_BASE_PATHS, LOGO_HIGHLIGHT_PATHS } from "@/lib/logo-paths";
import { UserWorkModal } from "@/components/user-work-modal";
import "leaflet/dist/leaflet.css";

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false },
);

const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false },
);

const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false },
);

const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});

interface UserWithLocation {
  id: string;
  name: string | null;
  image: string | null;
  city: string | null;
  stateProvince: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
}

interface LocationGroup {
  lat: number;
  lng: number;
  users: UserWithLocation[];
  locationKey: string;
}

interface GlobalMapProps {
  exhibitId?: string;
  mapHeight: string;
}

export function GlobalMap({ exhibitId, mapHeight }: GlobalMapProps) {
  const [users, setUsers] = useState<UserWithLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Create custom pin icon with Create Spot logo
  const [customIcon, setCustomIcon] = useState<any>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !mounted) return;

    const createCustomIcon = async () => {
      const L = await import("leaflet");
      const isDark = theme === "dark";
      const pinColor = isDark ? "#ffffff" : "#000000";
      const logoBase = isDark ? "#000000" : "#ffffff";
      const logoHighlight = isDark ? "#ffffff" : "#000000";

      // Create SVG for pin with logo
      // Pin shape: circular head at top (y=0 to ~y=16), pointy bottom (y=16 to y=48)
      // Logo viewBox is 0 0 729 796, we want it to fit in the circular head area
      // Target size: ~18px to fit nicely in the circular head (which is ~32px wide)
      const logoScale = 20 / 729; // Scale to fit 18px width
      const logoWidth = 729 * logoScale;
      const logoHeight = 796 * logoScale;
      const logoX = 16 - logoWidth / 2; // Center horizontally (pin center is at x=16)
      const logoY = 14 - logoHeight / 2; // Position in top circular area, slightly above center

      const pinSvg = `
        <svg width="32" height="48" viewBox="0 0 32 48" xmlns="http://www.w3.org/2000/svg">
          <!-- Pin shape -->
          <path d="M16 0C7.163 0 0 7.163 0 16c0 8.837 16 32 16 32s16-23.163 16-32C32 7.163 24.837 0 16 0z" fill="${pinColor}"/>
          <!-- Logo container (scaled and positioned in top circular head of pin) -->
          <g transform="translate(${logoX}, ${logoY}) scale(${logoScale})">
            ${LOGO_BASE_PATHS.map(
              (d) => `<path fill="${logoBase}" stroke="none" d="${d}"/>`,
            ).join("")}
            ${LOGO_HIGHLIGHT_PATHS.map(
              (d) => `<path fill="${logoHighlight}" stroke="none" d="${d}"/>`,
            ).join("")}
          </g>
        </svg>
      `;

      // Encode SVG for data URL
      const encodedSvg = encodeURIComponent(pinSvg);
      const iconUrl = `data:image/svg+xml;charset=utf-8,${encodedSvg}`;

      const icon = new L.default.Icon({
        iconUrl,
        iconSize: [32, 48],
        iconAnchor: [16, 48],
        popupAnchor: [0, -48],
      });

      setCustomIcon(icon);
    };

    createCustomIcon();
  }, [theme, mounted]);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const url = exhibitId
          ? `/api/exhibition/global?exhibitId=${encodeURIComponent(exhibitId)}`
          : "/api/exhibition/global";
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }
        const data = await response.json();
        setUsers(data.users || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load map data",
        );
      } finally {
        setLoading(false);
      }
    }

    if (mounted) {
      fetchUsers();
    }
  }, [mounted, exhibitId]);

  // Group users by location (same city = same location)
  const locationGroups = users.reduce((acc, user) => {
    const locationKey =
      `${user.city || ""}-${user.stateProvince || ""}-${user.country || ""}`.toLowerCase();
    const existingGroup = acc.find((g) => g.locationKey === locationKey);

    if (existingGroup) {
      existingGroup.users.push(user);
      // Average coordinates if multiple users in same city
      const avgLat =
        existingGroup.users.reduce((sum, u) => sum + u.latitude, 0) /
        existingGroup.users.length;
      const avgLng =
        existingGroup.users.reduce((sum, u) => sum + u.longitude, 0) /
        existingGroup.users.length;
      existingGroup.lat = avgLat;
      existingGroup.lng = avgLng;
    } else {
      acc.push({
        lat: user.latitude,
        lng: user.longitude,
        users: [user],
        locationKey,
      });
    }

    return acc;
  }, [] as LocationGroup[]);

  if (!mounted) {
    return (
      <div
        style={{ height: mapHeight }}
        className="w-full rounded-lg border bg-muted animate-pulse"
      />
    );
  }

  if (loading) {
    return (
      <div
        style={{ height: mapHeight }}
        className="w-full rounded-lg border bg-muted flex items-center justify-center"
      >
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{ height: mapHeight }}
        className="w-full rounded-lg border bg-muted flex items-center justify-center"
      >
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div
        style={{ height: mapHeight }}
        className="w-full rounded-lg border border-dashed border-border bg-card flex items-center justify-center"
      >
        <p className="text-sm text-muted-foreground">
          No artists with location data yet.
        </p>
      </div>
    );
  }

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Delay clearing userId to allow animation to complete
    setTimeout(() => setSelectedUserId(null), 300);
  };

  const locationString = (user: UserWithLocation) => {
    return [user.city, user.stateProvince, user.country]
      .filter(Boolean)
      .join(", ");
  };

  return (
    <>
      <div className="w-full">
        <div
          style={{ height: mapHeight }}
          className="w-full border-0 overflow-hidden"
        >
          <MapContainer
            center={[20, 0]}
            zoom={2}
            style={{ height: "100%", width: "100%" }}
            className="z-0"
          >
            <TileLayer
              url={
                theme === "dark"
                  ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              }
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {locationGroups.map((group, index) => (
              <Marker
                key={`${group.locationKey}-${index}`}
                position={[group.lat, group.lng]}
                icon={customIcon || undefined}
              >
                <Popup className="leaflet-popup-theme">
                  <TooltipProvider>
                    <div className="min-w-[200px] max-w-[300px] p-2">
                      <div className="mb-2">
                        <h3 className="font-semibold text-sm mb-1 text-foreground">
                          {group.users.length === 1
                            ? "Artist"
                            : `${group.users.length} Artists`}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {locationString(group.users[0])}
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto">
                        {group.users.map((user) => (
                          <Tooltip key={user.id}>
                            <TooltipTrigger asChild>
                              <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleUserClick(user.id)}
                                className="relative aspect-square rounded-md overflow-hidden transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                              >
                                <Avatar className="h-full w-full rounded-md">
                                  <AvatarImage src={user.image || undefined} />
                                  <AvatarFallback className="bg-muted text-muted-foreground text-xs">
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
                              </motion.button>
                            </TooltipTrigger>
                            <TooltipContent
                              side="top"
                              className="max-w-[200px]"
                            >
                              <div className="space-y-1">
                                <p className="font-medium">
                                  {user.name || "Anonymous"}
                                </p>
                                {locationString(user) && (
                                  <p className="text-xs text-muted-foreground">
                                    {locationString(user)}
                                  </p>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    </div>
                  </TooltipProvider>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
      <UserWorkModal
        userId={selectedUserId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}
