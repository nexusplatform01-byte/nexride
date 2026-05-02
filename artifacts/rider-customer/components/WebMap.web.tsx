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
  /** When set, this ref is populated with a function that flies the map to the latest GPS fix */
  locateMeRef?: MutableRefObject<(() => void) | null>;
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
    ".leaflet-container { background:#e8f0e0; font-family:inherit; }",
    ".leaflet-control-zoom { border:none !important; }",
    ".leaflet-control-zoom a { background:white !important; border-radius:8px !important; box-shadow:0 2px 8px rgba(0,0,0,0.18) !important; border:none !important; margin-bottom:4px !important; font-weight:bold; }",
    ".leaflet-control-attribution { font-size:8px; opacity:0.55; background:rgba(255,255,255,0.7) !important; }",
  ].join("\n");
  document.head.appendChild(style);
}

// ─── Marker HTML ──────────────────────────────────────────────────────────────

const MOTO_NEARBY_HTML = `
<div style="background:#0F3F5C;border:2px solid white;border-radius:10px;padding:4px 9px;display:flex;align-items:center;gap:5px;box-shadow:0 3px 10px rgba(15,63,92,0.4);cursor:pointer;white-space:nowrap;">
  <svg width="22" height="13" viewBox="0 0 22 13" fill="none">
    <circle cx="3.5" cy="10" r="2.5" stroke="white" stroke-width="1.4"/>
    <circle cx="18.5" cy="10" r="2.5" stroke="white" stroke-width="1.4"/>
    <path d="M3.5 10 L7 5 L14 5 L18.5 10" stroke="white" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M10 5 L12 2 L17 5" stroke="white" stroke-width="1.2" fill="white" fill-opacity="0.3" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="9.5" y="3.5" width="6" height="2" rx="1" fill="white" opacity="0.85"/>
    <path d="M18 7.5 L21 5.5" stroke="white" stroke-width="1.3" stroke-linecap="round"/>
  </svg>
  <span style="font-size:9px;font-weight:800;color:white;font-family:sans-serif;letter-spacing:0.5px;">BODA</span>
</div>`;

const CAR_NEARBY_HTML = `
<div style="background:white;border:2px solid #7C8B99;border-radius:10px;padding:4px 9px;display:flex;align-items:center;gap:5px;box-shadow:0 3px 10px rgba(0,0,0,0.18);cursor:pointer;white-space:nowrap;">
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

/**
 * Builds the GPS "you are here" marker HTML.
 * When the device has a heading (direction of travel), a cone is drawn
 * above the dot pointing in that direction — exactly like Google Maps.
 */
function makeUserDotHTML(heading: number | null): string {
  const hasCone = heading !== null && isFinite(heading);
  const cone = hasCone
    ? `<div style="position:absolute;top:-18px;left:-18px;width:60px;height:60px;pointer-events:none;">
        <svg width="60" height="60" viewBox="0 0 60 60" style="transform:rotate(${heading}deg)">
          <defs>
            <radialGradient id="cg" cx="50%" cy="80%" r="60%">
              <stop offset="0%" stop-color="#1a73e8" stop-opacity="0.55"/>
              <stop offset="100%" stop-color="#1a73e8" stop-opacity="0"/>
            </radialGradient>
          </defs>
          <polygon points="30,4 42,32 30,26 18,32" fill="url(#cg)"/>
        </svg>
      </div>`
    : "";
  return `<div style="position:relative;width:24px;height:24px;display:flex;align-items:center;justify-content:center;">
  ${cone}
  <div style="position:absolute;width:36px;height:36px;border-radius:50%;background:rgba(26,115,232,0.14);top:-6px;left:-6px;"></div>
  <div style="width:20px;height:20px;border-radius:50%;background:#1a73e8;border:3px solid white;box-shadow:0 2px 10px rgba(26,115,232,0.55);position:relative;z-index:1;"></div>
</div>`;
}

/**
 * Calculates compass bearing (0–360°, clockwise from north) between two
 * lat/lng points. Used to rotate direction arrows along the route.
 */
function routeBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const φ1 = lat1 * (Math.PI / 180);
  const φ2 = lat2 * (Math.PI / 180);
  const y = Math.sin(dLng) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(dLng);
  return (Math.atan2(y, x) * (180 / Math.PI) + 360) % 360;
}

const RIDER_MOTO_HTML = `
<div style="background:#0F3F5C;border:3px solid white;border-radius:14px;padding:7px 12px;display:flex;align-items:center;gap:7px;box-shadow:0 4px 18px rgba(15,63,92,0.5);min-width:70px;white-space:nowrap;">
  <svg width="28" height="17" viewBox="0 0 28 17" fill="none">
    <circle cx="4.5" cy="13" r="3.5" stroke="white" stroke-width="1.6"/>
    <circle cx="23.5" cy="13" r="3.5" stroke="white" stroke-width="1.6"/>
    <path d="M4.5 13 L9 6.5 L18 6.5 L23.5 13" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M13 6.5 L15.5 2.5 L21.5 6.5" stroke="white" stroke-width="1.4" fill="white" fill-opacity="0.25" stroke-linecap="round"/>
    <rect x="12" y="4" width="8" height="3" rx="1.5" fill="white" opacity="0.9"/>
    <path d="M23 9 L27 6" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
  </svg>
  <div>
    <div style="font-size:10px;font-weight:800;color:white;font-family:sans-serif;line-height:1.2;">RIDER</div>
    <div style="font-size:8px;color:rgba(255,255,255,0.75);font-family:sans-serif;">En route</div>
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
  locateMeRef,
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
        zoomControl: true,
        preferCanvas: false,
        maxBounds: GULU_BOUNDS,
        minZoom: GULU_MIN_ZOOM,
        maxZoom: 20,
        bounceAtZoomLimits: false,
      });

      // ── HOT tile layer: maximum detail for East Africa ──────────────────────
      // Humanitarian OpenStreetMap Team tiles — best coverage of small roads,
      // buildings, shops and local paths in African cities.
      L.tileLayer(
        "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
        {
          attribution:
            '© <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors, Tiles style by <a href="https://www.hotosm.org/">HOT</a>',
          subdomains: "abc",
          maxZoom: 20,
          maxNativeZoom: 20,
          crossOrigin: true,
          // Increase tile update speed
          keepBuffer: 4,
          updateWhenIdle: false,
          updateWhenZooming: false,
        }
      ).addTo(map);

      mapRef.current = map;

      map.on("click", (e: any) => onTapRef.current?.(e.latlng.lat, e.latlng.lng));

      if (recenterRef) {
        recenterRef.current = (lat, lng, z = GULU_DEFAULT_ZOOM) => {
          map.flyTo([lat, lng], z, { duration: 0.8 });
        };
      }

      // ── Continuous GPS tracking via watchPosition ──────────────────────────
      // watchPosition fires every time the device position changes (≤1s on
      // high-accuracy hardware, every few seconds on WiFi triangulation).
      // maximumAge:0 prevents the browser returning a stale cached fix.
      let watchId: number | null = null;
      let firstFix = true;
      let accuracyCircleRef: any = null;

      if (typeof navigator !== "undefined" && navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(
          (pos) => {
            if (cancelled) return;
            const { latitude, longitude, accuracy } = pos.coords;
            onLocationFoundRef.current?.(latitude, longitude);

            // Build icon with optional heading cone (Google Maps style)
            const heading = (pos.coords as any).heading ?? null;
            const dotHTML = makeUserDotHTML(
              heading !== null && isFinite(heading) ? heading : null
            );
            const icon = L.divIcon({
              html: dotHTML,
              className: "",
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            });

            // Move marker to new position (or create it); also refresh icon so
            // heading cone updates every time the device direction changes
            if (userLocMarkerRef.current) {
              userLocMarkerRef.current.setLatLng([latitude, longitude]);
              userLocMarkerRef.current.setIcon(icon);
            } else {
              userLocMarkerRef.current = L.marker([latitude, longitude], {
                icon,
                zIndexOffset: 500,
              }).addTo(map);
            }

            // Keep locateMeRef pointing at the freshest GPS fix so the
            // "locate me" button always flies to the real current position
            if (locateMeRef) {
              locateMeRef.current = () =>
                map.flyTo([latitude, longitude], GULU_DEFAULT_ZOOM, { duration: 0.9 });
            }

            // Draw accuracy circle (shows how accurate the fix is in metres)
            accuracyCircleRef?.remove();
            if (accuracy < 500) {
              accuracyCircleRef = L.circle([latitude, longitude], {
                radius: accuracy,
                color: "#1a73e8",
                fillColor: "#1a73e8",
                fillOpacity: 0.08,
                weight: 1.5,
                opacity: 0.4,
              }).addTo(map);
            }

            // Fly to location only on first fix; afterwards pan smoothly
            if (firstFix) {
              firstFix = false;
              map.flyTo([latitude, longitude], GULU_DEFAULT_ZOOM, { duration: 1.2 });
            } else {
              // Gently keep location in view if it drifts near the edge
              const bounds = map.getBounds();
              const pad = 0.0005;
              if (
                latitude < bounds.getSouth() + pad ||
                latitude > bounds.getNorth() - pad ||
                longitude < bounds.getWest() + pad ||
                longitude > bounds.getEast() - pad
              ) {
                map.panTo([latitude, longitude], { animate: true, duration: 0.5 });
              }
            }
          },
          (err) => {
            // Silent — permission denied or unavailable
            console.warn("GPS:", err.message);
          },
          {
            enableHighAccuracy: true,
            maximumAge: 0,        // always fresh — no cached positions
            timeout: 10000,
          }
        );
      }
    });

    return () => {
      cancelled = true;
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // ── Pickup marker (blue dot) ────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    import("leaflet").then((L) => {
      pickupMarkerRef.current?.remove();
      if (pickup) {
        const icon = L.divIcon({
          html: PICKUP_HTML,
          className: "",
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });
        pickupMarkerRef.current = L.marker([pickup.lat, pickup.lng], {
          icon,
          zIndexOffset: 400,
        }).addTo(mapRef.current);
      }
    });
  }, [pickup?.lat, pickup?.lng]);

  // ── Destination marker (green pin) ─────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    import("leaflet").then((L) => {
      destMarkerRef.current?.remove();
      if (destination) {
        const icon = L.divIcon({
          html: DEST_HTML,
          className: "",
          iconSize: [32, 44],
          iconAnchor: [16, 44],
        });
        destMarkerRef.current = L.marker([destination.lat, destination.lng], {
          icon,
          zIndexOffset: 400,
        }).addTo(mapRef.current);
        mapRef.current.flyTo(
          [destination.lat, destination.lng],
          GULU_DEFAULT_ZOOM,
          { duration: 0.8 }
        );
      }
    });
  }, [destination?.lat, destination?.lng]);

  // ── Rider location marker (large motorbike icon) ───────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    import("leaflet").then((L) => {
      riderMarkerRef.current?.remove();
      if (riderLocation) {
        const icon = L.divIcon({
          html: RIDER_MOTO_HTML,
          className: "",
          iconSize: [100, 44],
          iconAnchor: [50, 22],
        });
        riderMarkerRef.current = L.marker([riderLocation.lat, riderLocation.lng], {
          icon,
          zIndexOffset: 600,
        }).addTo(mapRef.current);
      }
    });
  }, [riderLocation?.lat, riderLocation?.lng]);

  // ── Route polyline (road-following via OSRM) ────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    import("leaflet").then((L) => {
      routeLayersRef.current.forEach((l) => l.remove());
      routeLayersRef.current = [];

      if (routeCoords?.length) {
        // OSRM returns [lng, lat] — flip to Leaflet's [lat, lng]
        const latlngs: [number, number][] = routeCoords.map(([lng, lat]) => [lat, lng]);

        // White casing for contrast
        const casing = L.polyline(latlngs, {
          color: "#FFFFFF",
          weight: 10,
          opacity: 0.95,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(mapRef.current);

        // Main navy route line
        const line = L.polyline(latlngs, {
          color: "#0F3F5C",
          weight: 5,
          opacity: 1,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(mapRef.current);

        // ── Direction arrows along the route (Google Maps style) ─────────────
        // Space ~7 arrows evenly. Each one is a small navy chevron rotated to
        // point in the direction of travel on that segment of road.
        const arrowLayers: any[] = [];
        const n = latlngs.length;
        if (n >= 4) {
          const step = Math.max(3, Math.floor(n / 7));
          for (let i = step; i < n - 2; i += step) {
            // Look a couple points ahead so the arrow follows the road curve
            const [lat1, lng1] = latlngs[i];
            const [lat2, lng2] = latlngs[Math.min(i + 3, n - 1)];
            const b = routeBearing(lat1, lng1, lat2, lng2);
            const arrowHtml = `<svg width="14" height="18" viewBox="0 0 14 18" style="transform:rotate(${b}deg);display:block;filter:drop-shadow(0 1px 3px rgba(0,0,0,0.3))"><polygon points="7,0 14,16 7,11 0,16" fill="#0F3F5C" opacity="0.88"/></svg>`;
            const arrowIcon = L.divIcon({
              html: arrowHtml,
              className: "",
              iconSize: [14, 18],
              iconAnchor: [7, 9],
            });
            arrowLayers.push(
              L.marker([lat1, lng1], { icon: arrowIcon, zIndexOffset: 300, interactive: false })
                .addTo(mapRef.current!)
            );
          }
        }

        routeLayersRef.current = [casing, line, ...arrowLayers];

        if (fitBoundsOnRoute && pickup && destination) {
          const allLats = [pickup.lat, destination.lat];
          const allLngs = [pickup.lng, destination.lng];
          mapRef.current.fitBounds(
            [
              [Math.min(...allLats), Math.min(...allLngs)],
              [Math.max(...allLats), Math.max(...allLngs)],
            ],
            { padding: [90, 60], maxZoom: GULU_DEFAULT_ZOOM }
          );
        }
      }
    });
  }, [routeCoords]);

  // ── Nearby rider markers ────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    import("leaflet").then((L) => {
      riderMarkersRef.current.forEach((m) => m.remove());
      riderMarkersRef.current = [];

      if (showRiders && nearbyRiders.length) {
        nearbyRiders.forEach((r) => {
          const html = r.type === "motorbike" ? MOTO_NEARBY_HTML : CAR_NEARBY_HTML;
          const w = r.type === "motorbike" ? 80 : 74;
          const icon = L.divIcon({
            html,
            className: "",
            iconSize: [w, 28],
            iconAnchor: [w / 2, 14],
          });
          riderMarkersRef.current.push(
            L.marker([r.lat, r.lng], { icon, zIndexOffset: 300 }).addTo(
              mapRef.current
            )
          );
        });
      }
    });
  }, [showRiders, nearbyRiders]);

  return <View ref={containerRef} style={styles.map} />;
}

const styles = StyleSheet.create({
  map: { flex: 1, backgroundColor: "#e8f0e0" },
});
