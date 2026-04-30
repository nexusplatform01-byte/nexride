import React, { MutableRefObject, useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";

import { LatLng } from "@/constants/gulu";

type Props = {
  pickup?: LatLng;
  destination?: LatLng;
  routeCoords?: [number, number][];
  onTap?: (lat: number, lng: number) => void;
  recenterRef?: MutableRefObject<((lat: number, lng: number, zoom?: number) => void) | null>;
  center?: LatLng;
  zoom?: number;
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
  style.textContent = `.leaflet-container { background: #DCE8EF; } .leaflet-control-attribution { font-size: 9px; opacity: 0.6; }`;
  document.head.appendChild(style);
}

const PICKUP_ICON_HTML = `<div style="width:26px;height:26px;border-radius:50%;background:#0F3F5C;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;"><div style="width:9px;height:9px;border-radius:50%;background:white;"></div></div>`;
const DEST_ICON_HTML = `<div style="width:32px;height:42px;"><svg viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:32px;height:42px;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.3))"><path d="M16 0C7.16 0 0 7.16 0 16c0 11.31 16 26 16 26s16-14.69 16-26C32 7.16 24.84 0 16 0z" fill="#0F3F5C"/><circle cx="16" cy="16" r="6" fill="white"/></svg></div>`;

export function WebMap({
  pickup,
  destination,
  routeCoords,
  onTap,
  recenterRef,
  center,
  zoom = 14,
}: Props) {
  const containerRef = useRef<View>(null);
  const mapRef = useRef<any>(null);
  const pickupMarkerRef = useRef<any>(null);
  const destMarkerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const onTapRef = useRef(onTap);
  onTapRef.current = onTap;

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
      });

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;

      map.on("click", (e: any) => {
        onTapRef.current?.(e.latlng.lat, e.latlng.lng);
      });

      if (recenterRef) {
        recenterRef.current = (lat: number, lng: number, z = 15) => {
          map.flyTo([lat, lng], z, { duration: 0.8 });
        };
      }

      if (pickup) {
        const icon = L.divIcon({ html: PICKUP_ICON_HTML, className: "", iconSize: [26, 26], iconAnchor: [13, 13] });
        pickupMarkerRef.current = L.marker([pickup.lat, pickup.lng], { icon }).addTo(map);
      }
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    import("leaflet").then((L) => {
      pickupMarkerRef.current?.remove();
      if (pickup) {
        const icon = L.divIcon({ html: PICKUP_ICON_HTML, className: "", iconSize: [26, 26], iconAnchor: [13, 13] });
        pickupMarkerRef.current = L.marker([pickup.lat, pickup.lng], { icon }).addTo(map);
      }
    });
  }, [pickup?.lat, pickup?.lng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    import("leaflet").then((L) => {
      destMarkerRef.current?.remove();
      if (destination) {
        const icon = L.divIcon({ html: DEST_ICON_HTML, className: "", iconSize: [32, 42], iconAnchor: [16, 42] });
        destMarkerRef.current = L.marker([destination.lat, destination.lng], { icon }).addTo(map);
        map.flyTo([destination.lat, destination.lng], 14, { duration: 0.8 });
      }
    });
  }, [destination?.lat, destination?.lng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    import("leaflet").then((L) => {
      polylineRef.current?.remove();
      if (routeCoords?.length) {
        const latlngs: [number, number][] = routeCoords.map(([lng, lat]) => [lat, lng]);
        polylineRef.current = L.polyline(latlngs, {
          color: "#FFFFFF",
          weight: 10,
          opacity: 0.85,
        }).addTo(map);
        L.polyline(latlngs, {
          color: "#0F3F5C",
          weight: 5,
          opacity: 1,
        }).addTo(map);

        if (pickup && destination) {
          map.fitBounds(
            [
              [Math.min(pickup.lat, destination.lat), Math.min(pickup.lng, destination.lng)],
              [Math.max(pickup.lat, destination.lat), Math.max(pickup.lng, destination.lng)],
            ],
            { padding: [80, 80] }
          );
        }
      }
    });
  }, [routeCoords]);

  return <View ref={containerRef} style={styles.map} />;
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
    backgroundColor: "#DCE8EF",
  },
});
