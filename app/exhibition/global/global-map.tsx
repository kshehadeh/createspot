"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "next-themes";
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
  const { theme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Fix Leaflet default icon issue
    if (typeof window !== "undefined") {
      import("leaflet").then((L) => {
        delete (L.default.Icon.Default.prototype as any)._getIconUrl;
        L.default.Icon.Default.mergeOptions({
          iconRetinaUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          iconUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        });
      });
    }
  }, []);

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

  return (
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
            >
              <Popup className="leaflet-popup-theme">
                <div className="min-w-[200px] max-w-[300px] p-2">
                  <div className="mb-2">
                    <h3 className="font-semibold text-sm mb-1 text-foreground">
                      {group.users.length === 1
                        ? "Artist"
                        : `${group.users.length} Artists`}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {[
                        group.users[0].city,
                        group.users[0].stateProvince,
                        group.users[0].country,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {group.users.map((user) => (
                      <Link
                        key={user.id}
                        href={`/profile/${user.id}`}
                        className="flex items-center gap-2 p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-foreground"
                      >
                        <Avatar className="h-8 w-8">
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
                        <span className="text-sm font-medium flex-1 truncate">
                          {user.name || "Anonymous"}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
