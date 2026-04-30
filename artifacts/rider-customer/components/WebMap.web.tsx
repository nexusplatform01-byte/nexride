import React, { MutableRefObject, useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";

import { GULU_BOUNDS, GULU_DEFAULT_ZOOM, GULU_MIN_ZOOM, LatLng, RiderMarker } from "@/constants/gulu";

type Props = {
  pickup?: LatLng;
  destination?: LatLng;
  riderLocation?: LatLng;
  routeCoords?: [number, number][];
  onTap?: (lat: number, lng: number) => void;
  onLocationFound?: (lat: number, lng: number) => void;
  recenterRef?: MutableRefObject<((lat: number, lng: number, zoom?: number) => void) | null>;
  center?: LatLng;
  zoom?: number;
  showRiders?: boolean;
  nearbyRiders?: RiderMarker[];
  fitBoundsOnRoute?: boolean;
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
    ".leaflet-control-attribution { font-size:9px; opacity:0.5; }",
    ".riider-marker { display:flex;align-items:center;justify-content:center; }",
  ].join("\n");
  document.head.appendChild(style);
}

// ─── Marker HTML ─────────────────────────────────────────────────────────────

const MOTO_NEARBY_HTML = `
<div class="riider-marker" style="background:#0F3F5C;border:2px solid white;border-radius:10px;padding:4px 9px;display:flex;align-items:center;gap:5px;box-shadow:0 3px 10px rgba(15,63,92,0.35);cursor:pointer;">
  <svg width="22" height="13" viewBox="0 0 22 13" fill="none">
    <circle cx="3.5" cy="10" r="2.5" stroke="white" stroke-width="1.4"/>
    <circle cx="18.5" cy="10" r="2.5" stroke="white" stroke-width="1.4"/>
    <path d="M3.5 10 L7 5 L14 5 L18.5 10" stroke="white" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M10 5 L12 2 L17 5" stroke="white" stroke-width="1.2" fill="white" fill-opacity="0.3" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="9.5" y="3.5" width="6" height="2" rx="1" fill="white" opacity="0.85"/>
    <path d="M18 7.5 L21 5.5" stroke="white" stroke-width="1.3" stroke-linecap="round"/>
  </svg>
  <span style="font-size:9px;font-weight:800;color:white;font-family:sans-serif;letter-spacing:0.3px;">BODA</span>
</div>`;

const CAR_NEARBY_HTML = `
<div class="riider-marker" style="background:white;border:2px solid #7C8B99;border-radius:10px;padding:4px 9px;display:flex;align-items:center;gap:5px;box-shadow:0 3px 10px rgba(0,0,0,0.18);cursor:pointer;">
  <svg width="22" height="13" viewBox="0 0 22 13" fill="none">
    <path d="M4 8 L6 3 L16 3 L18 8 L18 11 L4 11 Z" stroke="#7C8B99" stroke-width="1.3" fill="#7C8B99" fill-opacity="0.12" stroke-linejoin="round"/>
    <circle cx="7" cy="11" r="2" stroke="#7C8B99" stroke-width="1.4"/>
    <circle cx="15" cy="11" r="2" stroke="#7C8B99" stroke-width="1.4"/>
    <path d="M4 8 L18 8" stroke="#7C8B99" stroke-width="1.2"/>
    <path d="M7 8 L8.5 4 L13.5 4 L15 8" stroke="#7C8B99" stroke-width="1" fill="none" opacity="0.6"/>
  </svg>
  <span style="font-size:9px;font-weight:700;color:#7C8B99;font-family:sans-serif;">CAR</span>
</div>`;

const PICKUP_HTML = `
<div style="width:28px;height:28px;border-radius:50%;background:#1a73e8;border:3.5px solid white;box-shadow:0 0 0 4px rgba(26,115,232,0.25),0 3px 12px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;">
  <div style="width:10px;height:10px;border-radius:50%;background:white;"></div>
</div>`;

const DEST_HTML = `
<div style="width:32px;height:44px;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.3));">
  <svg viewBox="0 0 32 44" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 0C7.16 0 0 7.16 0 16c0 11.31 16 28 16 28s16-16.69 16-28C32 7.16 24.84 0 16 0z" fill="#1FB57A"/>
    <circle cx="16" cy="16" r="7" fill="white"/>
    <circle cx="16" cy="16" r="4" fill="#1FB57A"/>
  </svg>
</div>`;

const USER_LOCATION_HTML = `
<div style="position:relative;width:24px;height:24px;display:flex;align-items:center;justify-content:center;">
  <div style="position:absolute;width:24px;height:24px;border-radius:50%;background:rgba(26,115,232,0.2);animation:none;"></div>
  <div style="width:14px;height:14px;border-radius:50%;background:#1a73e8;border:2.5px solid white;box-shadow:0 2px 8px rgba(26,115,232,0.5);"></div>
</div>`;

const RIDER_MOTO_HTML = `
<div style="background:#0F3F5C;border:3px solid white;border-radius:14px;padding:7px 12px;display:flex;align-items:center;gap:7px;box-shadow:0 4px 16px rgba(15,63,92,0.45);min-width:70px;">
  <svg width="28" height="17" viewBox="0 0 28 17" fill="none">
    <circle cx="4.5" cy="13" r="3.5" stroke="white" stroke-width="1.6"/>
    <circle cx="23.5" cy="13" r="3.5" stroke="white" stroke-width="1.6"/>
    <path d="M4.5 13 L9 6.5 L18 6.5 L23.5 13" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M13 6.5 L15.5 2.5 L21.5 6.5" stroke="white" stroke-width="1.4" fill="white" fill-opacity="0.25" stroke-linecap="round"/>
    <rect x="12" y="4" width="8" height="3" rx="1.5" fill="white" opacity="0.9"/>
    <path d="M23 9 L27 6" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="14" cy="13" r="1" fill="white" opacity="0.5"/>
  </svg>
  <div>
    <div style="font-size:10px;font-weight:800;color:white;font-family:sans-serif;line-height:1.2;">RIDER</div>
    <div style="font-size:8px;color:rgba(255,255,255,0.7);font-family:sans-serif;">En route</div>
  </div>
</div>`;

export function WebMap({
  pickup,
  destination,
  riderLocation,
  routeCoords,
  onTap,
  onLocationFound,
  recenterRef,
  center,
  zoom = GULU_DEFAULT_ZOOM,
  showRiders = false,
  nearbyRiders = [],
  fitBoundsOnRoute = true,
}: Props) {
  const containerRef = useRef<View>(null);
  const mapRef = useRef<any>(null);
  const pickupMarkerRef = useRef<any>(null);
  const destMarkerRef = useRef<any>(null);
  const riderMarkerRef = useRef<any>(null);
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
        attribution: "© <a href='https://osm.org/copyright'>OSM</a>",
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;

      map.on("click", (e: any) => onTapRef.current?.(e.latlng.lat, e.latlng.lng));

      if (recenterRef) {
        recenterRef.current = (lat, lng, z = GULU_DEFAULT_ZOOM) => {
          map.flyTo([lat, lng], z, { duration: 0.8 });
        };
      }

      if (typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (cancelled) return;
            const { latitude, longitude } = pos.coords;
            onLocationFoundRef.current?.(latitude, longitude);
            userLocMarkerRef.current?.remove();
            const icon = L.divIcon({ html: USER_LOCATION_HTML, className: "", iconSize: [24, 24], iconAnchor: [12, 12] });
            userLocMarkerRef.current = L.marker([latitude, longitude], { icon, zIndexOffset: 500 }).addTo(map);
            map.flyTo([latitude, longitude], GULU_DEFAULT_ZOOM, { duration: 1.2 });
          },
          () => {},
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

  // Pickup marker (blue dot)
  useEffect(() => {
    if (!mapRef.current) return;
    import("leaflet").then((L) => {
      pickupMarkerRef.current?.remove();
      if (pickup) {
        const icon = L.divIcon({ html: PICKUP_HTML, className: "", iconSize: [28, 28], iconAnchor: [14, 14] });
        pickupMarkerRef.current = L.marker([pickup.lat, pickup.lng], { icon, zIndexOffset: 400 }).addTo(mapRef.current);
      }
    });
  }, [pickup?.lat, pickup?.lng]);

  // Destination marker (green pin)
  useEffect(() => {
    if (!mapRef.current) return;
    import("leaflet").then((L) => {
      destMarkerRef.current?.remove();
      if (destination) {
        const icon = L.divIcon({ html: DEST_HTML, className: "", iconSize: [32, 44], iconAnchor: [16, 44] });
        destMarkerRef.current = L.marker([destination.lat, destination.lng], { icon, zIndexOffset: 400 }).addTo(mapRef.current);
        mapRef.current.flyTo([destination.lat, destination.lng], 15, { duration: 0.8 });
      }
    });
  }, [destination?.lat, destination?.lng]);

  // Rider location marker (large motorbike)
  useEffect(() => {
    if (!mapRef.current) return;
    import("leaflet").then((L) => {
      riderMarkerRef.current?.remove();
      if (riderLocation) {
        const icon = L.divIcon({ html: RIDER_MOTO_HTML, className: "", iconSize: [94, 44], iconAnchor: [47, 22] });
        riderMarkerRef.current = L.marker([riderLocation.lat, riderLocation.lng], { icon, zIndexOffset: 600 }).addTo(mapRef.current);
      }
    });
  }, [riderLocation?.lat, riderLocation?.lng]);

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

        if (fitBoundsOnRoute && pickup && destination) {
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
          const html = r.type === "motorbike" ? MOTO_NEARBY_HTML : CAR_NEARBY_HTML;
          const w = r.type === "motorbike" ? 78 : 72;
          const icon = L.divIcon({ html, className: "", iconSize: [w, 28], iconAnchor: [w / 2, 14] });
          riderMarkersRef.current.push(
            L.marker([r.lat, r.lng], { icon, zIndexOffset: 300 }).addTo(mapRef.current)
          );
        });
      }
    });
  }, [showRiders, nearbyRiders]);

  return <View ref={containerRef} style={styles.map} />;
}

const styles = StyleSheet.create({
  map: { flex: 1, backgroundColor: "#c9dfe8" },
});
