import React from "react";
import { MutableRefObject } from "react";

import { FakeMap } from "@/components/FakeMap";
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

export function WebMap({ destination }: Props) {
  return <FakeMap variant={destination ? "route" : "drivers"} />;
}
