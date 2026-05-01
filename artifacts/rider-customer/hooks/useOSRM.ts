import { useCallback, useState } from "react";
import { Platform } from "react-native";

import { LatLng } from "@/constants/gulu";

export type RouteResult = {
  distanceKm: number;
  durationMin: number;
  coords: [number, number][];
};

/** Base URL for the Riider API server (handles routing proxy to avoid CORS). */
function apiBase(): string {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    // On web, use the shared proxy path (same origin, routed by the reverse proxy)
    return `${window.location.protocol}//${window.location.host}/api`;
  }
  // Native: use the Replit dev domain via env
  const domain = process.env.EXPO_PUBLIC_DOMAIN ?? "localhost:80";
  return `https://${domain}/api`;
}

export function useOSRM() {
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const fetchRoute = useCallback(async (from: LatLng, to: LatLng) => {
    setLoading(true);
    setError(false);
    try {
      const url = `${apiBase()}/route?from_lng=${from.lng}&from_lat=${from.lat}&to_lng=${to.lng}&to_lat=${to.lat}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Route proxy status: ${res.status}`);
      const data = (await res.json()) as RouteResult;
      if (!data.coords?.length) throw new Error("Empty route");
      setRoute(data);
    } catch {
      setError(true);
      setRoute(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearRoute = useCallback(() => setRoute(null), []);

  return { route, loading, error, fetchRoute, clearRoute };
}
