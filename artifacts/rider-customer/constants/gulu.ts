export type LatLng = { lat: number; lng: number };
export type NamedLocation = LatLng & { name: string };

export const GULU_CENTER: LatLng = { lat: 2.7749, lng: 32.299 };

export const PICKUP_LOCATION: NamedLocation = {
  lat: 2.7749,
  lng: 32.299,
  name: "Gulu City Center",
};

/** Leaflet maxBounds: [[south, west], [north, east]] */
export const GULU_BOUNDS: [[number, number], [number, number]] = [
  [2.58, 32.08],
  [2.96, 32.52],
];

export const GULU_MIN_ZOOM = 12;
export const GULU_DEFAULT_ZOOM = 18;

export const POPULAR_PLACES: NamedLocation[] = [
  { name: "Gulu University", lat: 2.7634, lng: 32.2989 },
  { name: "Gulu Regional Referral Hospital", lat: 2.7701, lng: 32.3044 },
  { name: "Gulu Main Market", lat: 2.7769, lng: 32.3012 },
  { name: "Kaunda Grounds", lat: 2.7784, lng: 32.2948 },
  { name: "Layibi Division", lat: 2.783, lng: 32.278 },
  { name: "Pece Stadium", lat: 2.7698, lng: 32.2842 },
  { name: "Gulu Municipal Council", lat: 2.7759, lng: 32.3038 },
  { name: "Acholi Inn Hotel", lat: 2.7756, lng: 32.3002 },
  { name: "City Mall Gulu", lat: 2.7741, lng: 32.3077 },
  { name: "St. Joseph's Cathedral", lat: 2.7718, lng: 32.2959 },
  { name: "Pece War Memorial", lat: 2.7823, lng: 32.2874 },
  { name: "Gulu Bus Terminal", lat: 2.7772, lng: 32.3021 },
  { name: "Laroo Division", lat: 2.8012, lng: 32.2834 },
  { name: "Bardege Division", lat: 2.7910, lng: 32.3120 },
  { name: "Unyama River Bridge", lat: 2.7605, lng: 32.2791 },
];

export type RiderMarker = LatLng & { type: "motorbike" | "car" };

/** Fake nearby available riders shown on the idle map */
export const NEARBY_RIDERS: RiderMarker[] = [
  { lat: 2.7762, lng: 32.2998, type: "motorbike" },
  { lat: 2.7728, lng: 32.2967, type: "motorbike" },
  { lat: 2.7784, lng: 32.2976, type: "motorbike" },
  { lat: 2.7755, lng: 32.3024, type: "motorbike" },
  { lat: 2.7714, lng: 32.3008, type: "motorbike" },
  { lat: 2.7739, lng: 32.2951, type: "motorbike" },
  { lat: 2.7773, lng: 32.3042, type: "motorbike" },
  { lat: 2.7696, lng: 32.2981, type: "motorbike" },
  { lat: 2.7810, lng: 32.3005, type: "motorbike" },
  { lat: 2.7743, lng: 32.2918, type: "motorbike" },
  { lat: 2.7740, lng: 32.2979, type: "car" },
  { lat: 2.7798, lng: 32.3018, type: "car" },
];

const RATES: Record<string, { perKm: number; minimum: number }> = {
  motorbike: { perKm: 900, minimum: 2000 },
  economy: { perKm: 1400, minimum: 5000 },
  premium: { perKm: 2200, minimum: 8000 },
  luxury: { perKm: 3500, minimum: 12000 },
};

export function calcFare(distanceKm: number, rideType: string): number {
  const r = RATES[rideType] ?? RATES.motorbike;
  return Math.max(r.minimum, Math.round((distanceKm * r.perKm) / 100) * 100);
}
