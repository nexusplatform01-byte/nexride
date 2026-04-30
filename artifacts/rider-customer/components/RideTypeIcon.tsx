import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { View } from "react-native";

import { useColors } from "@/hooks/useColors";

export type RideType = "economy" | "premium" | "luxury" | "motorbike";

const ICONS: Record<RideType, keyof typeof MaterialCommunityIcons.glyphMap> = {
  economy: "car-hatchback",
  premium: "car-sports",
  luxury: "car-estate",
  motorbike: "motorbike",
};

export function RideTypeIcon({
  type,
  size = 28,
  color,
}: {
  type: RideType;
  size?: number;
  color?: string;
}) {
  const colors = useColors();
  return (
    <View>
      <MaterialCommunityIcons
        name={ICONS[type]}
        size={size}
        color={color ?? colors.foreground}
      />
    </View>
  );
}
