export type LatLng = { lat: number; lng: number };
export type NamedLocation = LatLng & { name: string };

export const GULU_CENTER: LatLng = { lat: 2.7749, lng: 32.299 };

export const PICKUP_LOCATION: NamedLocation = {
  lat: 2.7746,
  lng: 32.2983,
  name: "Gulu City Center",
};

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
];

const RATES: Record<string, { perKm: number; minimum: number }> = {
  economy: { perKm: 1400, minimum: 3000 },
  premium: { perKm: 2200, minimum: 5000 },
  luxury: { perKm: 3500, minimum: 8000 },
  motorbike: { perKm: 900, minimum: 2000 },
};

export function calcFare(distanceKm: number, rideType: string): number {
  const r = RATES[rideType] ?? RATES.economy;
  return Math.max(r.minimum, Math.round(distanceKm * r.perKm / 100) * 100);
}
