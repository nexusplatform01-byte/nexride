import { useCallback, useRef, useState } from "react";

export type NominatimResult = {
  place_id: number;
  display_name: string;
  name: string;
  lat: number;
  lng: number;
};

export function useNominatim() {
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(async (query: string) => {
    abortRef.current?.abort();
    if (!query.trim()) {
      setResults([]);
      return;
    }
    abortRef.current = new AbortController();
    setLoading(true);
    try {
      const q = encodeURIComponent(query + " Gulu Uganda");
      const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=6&addressdetails=0&countrycodes=ug`;
      const res = await fetch(url, {
        signal: abortRef.current.signal,
        headers: { "Accept-Language": "en" },
      });
      const data: any[] = await res.json();
      setResults(
        data.map((r) => ({
          place_id: r.place_id,
          display_name: r.display_name,
          name: r.name || r.display_name.split(",")[0],
          lat: parseFloat(r.lat),
          lng: parseFloat(r.lon),
        }))
      );
    } catch (e: any) {
      if (e?.name !== "AbortError") setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    abortRef.current?.abort();
    setResults([]);
  }, []);

  return { results, loading, search, clear };
}
