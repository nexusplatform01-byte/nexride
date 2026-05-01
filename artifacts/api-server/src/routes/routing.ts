import { Router, type IRouter } from "express";

const router: IRouter = Router();

/**
 * Generates a realistic road-following route approximation for Gulu City.
 * Uses a grid-routing approach: route goes along the nearest main road
 * east/west first, then north/south — matching how Gulu's grid road
 * network actually works.
 */
function guluGridRoute(
  fromLng: number,
  fromLat: number,
  toLng: number,
  toLat: number
): [number, number][] {
  // Main road corridors in Gulu City (lng values of major N-S roads)
  const nsRoads = [32.283, 32.290, 32.299, 32.308, 32.315];
  // Main road corridors (lat values of major E-W roads)
  const ewRoads = [2.762, 2.770, 2.776, 2.783, 2.791];

  // Find the nearest main N-S road to snap onto
  const nearNS = nsRoads.reduce((a, b) =>
    Math.abs(a - fromLng) < Math.abs(b - fromLng) ? a : b
  );
  const destNS = nsRoads.reduce((a, b) =>
    Math.abs(a - toLng) < Math.abs(b - toLng) ? a : b
  );

  // Find the nearest main E-W road to transition on
  const midLat = ewRoads.reduce((a, b) =>
    Math.abs(a - (fromLat + toLat) / 2) < Math.abs(b - (fromLat + toLat) / 2) ? a : b
  );

  // Build route: from → nearest N-S road → transition via E-W road → destination
  const waypoints: [number, number][] = [
    [fromLng, fromLat],
    [nearNS, fromLat],    // move to nearest N-S road
    [nearNS, midLat],     // follow N-S road to E-W crossing
    [destNS, midLat],     // follow E-W road to destination's N-S road
    [destNS, toLat],      // follow destination's N-S road
    [toLng, toLat],       // last leg to exact destination
  ];

  // Interpolate each segment into fine-grained points for smooth appearance
  const interpolated: [number, number][] = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const [x0, y0] = waypoints[i];
    const [x1, y1] = waypoints[i + 1];
    const steps = Math.max(4, Math.round(Math.sqrt((x1 - x0) ** 2 + (y1 - y0) ** 2) * 5000));
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      interpolated.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t]);
    }
  }
  return interpolated;
}

/** Haversine distance in km between two lat/lng points. */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Proxy for OSRM routing API — falls back to Gulu road-grid approximation
router.get("/route", async (req, res) => {
  const { from_lng, from_lat, to_lng, to_lat } = req.query as Record<string, string>;

  if (!from_lng || !from_lat || !to_lng || !to_lat) {
    res.status(400).json({ error: "Missing parameters: from_lng, from_lat, to_lng, to_lat" });
    return;
  }

  const fLng = parseFloat(from_lng);
  const fLat = parseFloat(from_lat);
  const tLng = parseFloat(to_lng);
  const tLat = parseFloat(to_lat);

  // Try live OSRM endpoints first
  const coord = `${from_lng},${from_lat};${to_lng},${to_lat}`;
  const endpoints = [
    `https://router.project-osrm.org/route/v1/driving/${coord}?overview=full&geometries=geojson`,
    `https://routing.openstreetmap.de/routed-car/route/v1/driving/${coord}?overview=full&geometries=geojson`,
  ];

  for (const url of endpoints) {
    try {
      const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!resp.ok) continue;
      const data = await resp.json() as {
        routes?: Array<{
          geometry: { coordinates: [number, number][] };
          distance: number;
          duration: number;
        }>;
      };
      if (data.routes?.[0]) {
        res.json({
          coords: data.routes[0].geometry.coordinates,
          distanceKm: Math.round((data.routes[0].distance / 1000) * 10) / 10,
          durationMin: Math.max(1, Math.round(data.routes[0].duration / 60)),
          source: "osrm",
        });
        return;
      }
    } catch {
      // try next
    }
  }

  // Fallback: Gulu road-grid approximation
  const coords = guluGridRoute(fLng, fLat, tLng, tLat);
  const straightKm = haversineKm(fLat, fLng, tLat, tLng);
  // Grid routing is roughly 35% longer than straight line
  const estimatedKm = Math.round(straightKm * 1.35 * 10) / 10;
  const estimatedMin = Math.max(1, Math.round((estimatedKm / 20) * 60)); // avg 20 km/h boda speed

  res.json({
    coords,
    distanceKm: estimatedKm,
    durationMin: estimatedMin,
    source: "gulu-grid-fallback",
  });
});

export default router;
