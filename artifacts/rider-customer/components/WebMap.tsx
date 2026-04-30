import React from "react";
import { MutableRefObject } from "react";

import { FakeMap } from "@/components/FakeMap";
import { LatLng, RiderMarker } from "@/constants/gulu";

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

export function WebMap({ destination, riderLocation }: Props) {
  return <FakeMap variant={riderLocation || destination ? "route" : "drivers"} />;
}
