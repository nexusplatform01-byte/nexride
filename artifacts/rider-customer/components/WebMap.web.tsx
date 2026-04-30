import React, { MutableRefObject, useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";

import { GULU_BOUNDS, GULU_DEFAULT_ZOOM, GULU_MIN_ZOOM, LatLng, RiderMarker } from "@/constants/gulu";

type Props = {
  pickup?: LatLng;
  destination?: LatLng;
  routeCoords?: [number, number][];
  onTap?: (lat: number, lng: number) => void;
  onLocationFound?: (lat: number, lng: number) => void;
  recenterRef?: MutableRefObject<((lat: number, lng: number, zoom?: number) => void) | null>;
  center?: LatLng;
  zoom?: number;
  showRiders?: boolean;
  nearbyRiders?: RiderMarker[];
};

let cssInjected = false;
function injectLeafletCSS() {
  if (cssInjected) return;
  cssInjected = true;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://unpkg.com/leaflet@1/dist/leaflet.css";
  document.head.appendChild(link);
  const style = document.createElement("style");
  style.textContent = [
    ".leaflet-container { background:#c9dfe8; font-family: inherit; }",
    ".leaflet-control-zoom { display:none; }",
    ".leaflet-control-attribution { font-size:9px; opacity:0.5; bottom:4px; right:4px; }",
    ".rider-marker { transition: transform 0.3s ease; }",
    ".rider-marker:hover { transform: scale(1.15); }",
  ].join("\n");
  document.head.appendChild(style);
}

const PICKUP_HTML = `<div style="width:26px;height:26px;border-radius:50%;background:#0F3F5C;border:3px solid white;box-shadow:0 2px 12px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;"><div style="width:9px;height:9px;border-radius:50%;background:white;"></div></div>`;
const DEST_HTML = `<div style="width:30px;height:40px;"><svg viewBox="0 0 30 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 0C6.72 0 0 6.72 0 15c0 10.6 15 25 15 25s15-14.4 15-25C30 6.72 23.28 0 15 0z" fill="#E5484D"/><circle cx="15" cy="15" r="6" fill="white"/></svg></div>`;
const MOTO_HTML = `<div class="rider-marker" title="Boda-Boda available" style="background:white;border:1.5px solid #E2E7EC;border-radius:8px;padding:3px 7px;display:flex;align-items:center;gap:4px;box-shadow:0 2px 8px rgba(0,0,0,0.15);white-space:nowrap;"><svg viewBox="0 0 20 14" width="20" height="14" fill="none"><path d="M3.5 9.5a2 2 0 100-4 2 2 0 000 4zm13 0a2 2 0 100-4 2 2 0 000 4zM2 6.5l2-3h8l2 3" stroke="#0F3F5C" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 3.5h3l1.5 3" stroke="#0F3F5C" stroke-width="1.4" stroke-linecap="round"/></svg><span style="font-size:9px;font-weight:700;color:#0F3F5C;font-family:sans-serif;">Boda</span></div>`;
const CAR_HTML = `<div class="rider-marker" title="Car available" style="background:white;border:1.5px solid #E2E7EC;border-radius:8px;padding:3px 7px;display:flex;align-items:center;gap:4px;box-shadow:0 2px 8px rgba(0,0,0,0.15);white-space:nowrap;"><svg viewBox="0 0 20 12" width="20" height="12" fill="none"><rect x="2" y="4" width="16" height="7" rx="2" fill="#7C8B99" opacity="0.2"/><path d="M2 7h16M5 11v1M15 11v1" stroke="#7C8B99" stroke-width="1.3" stroke-linecap="round"/><path d="M4 7l2-4h8l2 4" stroke="#7C8B99" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg><span style="font-size:9px;font-weight:700;color:#7C8B99;font-family:sans-serif;">Car</span></div>`;
const USER_LOCATION_HTML = `<div style="width:18px;height:18px;border-radius:50%;background:#4A90E2;border:3px solid white;box-shadow:0 0 0 6px rgba(74,144,226,0.2);"></div>`;

export function WebMap({
  pickup,
  destination,
  routeCoords,
  onTap,
  onLocationFound,
  recenterRef,
  center,
  zoom = GULU_DEFAULT_ZOOM,
  showRiders = false,
  nearbyRiders = [],
}: Props) {
  const containerRef = useRef<View>(null);
  const mapRef = useRef<any>(null);
  const pickupMarkerRef = useRef<any>(null);
  const destMarkerRef = useRef<any>(null);
  const routeLayersRef = useRef<any[]>([]);
  const riderMarkersRef = useRef<any[]>([]);
  const userLocMarkerRef = useRef<any>(null);
  const onTapRef = useRef(onTap);
  onTapRef.current = onTap;
  const onLocationFoundRef = useRef(onLocationFound);
  onLocationFoundRef.current = onLocationFound;

  const defaultCenter = center ?? { lat: 2.7749, lng: 32.299 };

  useEffect(() => {
    injectLeafletCSS();
    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled) return;
      const domEl = containerRef.current as unknown as HTMLElement;
      if (!domEl) return;

      const map = L.map(domEl, {
        center: [defaultCenter.lat, defaultCenter.lng],
        zoom,
        zoomControl: false,
        preferCanvas: true,
        maxBounds: GULU_BOUNDS,
        minZoom: GULU_MIN_ZOOM,
        maxZoom: 19,
        bounceAtZoomLimits: false,
      });

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© <a href='https://osm.org/copyright'>OpenStreetMap</a>",
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;

      map.on("click", (e: any) => {
        onTapRef.current?.(e.latlng.lat, e.latlng.lng);
      });

      if (recenterRef) {
        recenterRef.current = (lat: number, lng: number, z = GULU_DEFAULT_ZOOM) => {
          map.flyTo([lat, lng], z, { duration: 0.8 });
        };
      }

      // Request real GPS location
      if (typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (cancelled) return;
            const { latitude, longitude } = pos.coords;
            onLocationFoundRef.current?.(latitude, longitude);
            if (userLocMarkerRef.current) userLocMarkerRef.current.remove();
            const icon = L.divIcon({ html: USER_LOCATION_HTML, className: "", iconSize: [18, 18], iconAnchor: [9, 9] });
            userLocMarkerRef.current = L.marker([latitude, longitude], { icon }).addTo(map);
            map.flyTo([latitude, longitude], GULU_DEFAULT_ZOOM, { duration: 1.2 });
          },
          () => { /* silently fall back to hardcoded center */ },
          { enableHighAccuracy: true, timeout: 8000 }
        );
      }
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Pickup marker
  useEffect(() => {
    if (!mapRef.current) return;
    import("leaflet").then((L) => {
      pickupMarkerRef.current?.remove();
      if (pickup) {
        const icon = L.divIcon({ html: PICKUP_HTML, className: "", iconSize: [26, 26], iconAnchor: [13, 13] });
        pickupMarkerRef.current = L.marker([pickup.lat, pickup.lng], { icon }).addTo(mapRef.current);
      }
    });
  }, [pickup?.lat, pickup?.lng]);

  // Destination marker
  useEffect(() => {
    if (!mapRef.current) return;
    import("leaflet").then((L) => {
      destMarkerRef.current?.remove();
      if (destination) {
        const icon = L.divIcon({ html: DEST_HTML, className: "", iconSize: [30, 40], iconAnchor: [15, 40] });
        destMarkerRef.current = L.marker([destination.lat, destination.lng], { icon }).addTo(mapRef.current);
        mapRef.current.flyTo([destination.lat, destination.lng], 15, { duration: 0.8 });
      }
    });
  }, [destination?.lat, destination?.lng]);

  // Route polyline
  useEffect(() => {
    if (!mapRef.current) return;
    import("leaflet").then((L) => {
      routeLayersRef.current.forEach((l) => l.remove());
      routeLayersRef.current = [];

      if (routeCoords?.length) {
        const latlngs: [number, number][] = routeCoords.map(([lng, lat]) => [lat, lng]);

        const casing = L.polyline(latlngs, { color: "#FFFFFF", weight: 10, opacity: 0.9 }).addTo(mapRef.current);
        const line = L.polyline(latlngs, { color: "#0F3F5C", weight: 5, opacity: 1 }).addTo(mapRef.current);
        routeLayersRef.current = [casing, line];

        if (pickup && destination) {
          mapRef.current.fitBounds(
            [
              [Math.min(pickup.lat, destination.lat), Math.min(pickup.lng, destination.lng)],
              [Math.max(pickup.lat, destination.lat), Math.max(pickup.lng, destination.lng)],
            ],
            { padding: [80, 60], maxZoom: 17 }
          );
        }
      }
    });
  }, [routeCoords]);

  // Nearby rider markers
  useEffect(() => {
    if (!mapRef.current) return;
    import("leaflet").then((L) => {
      riderMarkersRef.current.forEach((m) => m.remove());
      riderMarkersRef.current = [];

      if (showRiders && nearbyRiders.length) {
        nearbyRiders.forEach((r) => {
          const html = r.type === "motorbike" ? MOTO_HTML : CAR_HTML;
          const size: [number, number] = r.type === "motorbike" ? [44, 28] : [40, 28];
          const icon = L.divIcon({ html, className: "", iconSize: size, iconAnchor: [size[0] / 2, 14] });
          const marker = L.marker([r.lat, r.lng], { icon }).addTo(mapRef.current);
          riderMarkersRef.current.push(marker);
        });
      }
    });
  }, [showRiders, nearbyRiders]);

  return <View ref={containerRef} style={styles.map} />;
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
    backgroundColor: "#c9dfe8",
  },
});
