import { useCallback, useState } from "react";

import { LatLng } from "@/constants/gulu";

export type RouteResult = {
  distanceKm: number;
  durationMin: number;
  coords: [number, number][];
};

export function useOSRM() {
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const fetchRoute = useCallback(async (from: LatLng, to: LatLng) => {
    setLoading(true);
    setError(false);
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();
      const r = data.routes?.[0];
      if (!r) throw new Error("no route");
      setRoute({
        distanceKm: r.distance / 1000,
        durationMin: Math.max(1, Math.round(r.duration / 60)),
        coords: r.geometry.coordinates,
      });
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
