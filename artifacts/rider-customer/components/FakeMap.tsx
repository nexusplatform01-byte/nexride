import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";

import { useColors } from "@/hooks/useColors";

type Props = {
  variant?: "route" | "drivers";
  style?: ViewStyle;
};

export function FakeMap({ variant = "route", style }: Props) {
  const colors = useColors();

  return (
    <View style={[styles.container, style]}>
      <Svg width="100%" height="100%" viewBox="0 0 400 700" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#E8EEF1" />
            <Stop offset="1" stopColor="#DCE5EA" />
          </LinearGradient>
          <LinearGradient id="park" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#CFE3CF" />
            <Stop offset="1" stopColor="#B9D5B6" />
          </LinearGradient>
          <LinearGradient id="water" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#BEDDEC" />
            <Stop offset="1" stopColor="#A6CFE2" />
          </LinearGradient>
        </Defs>

        <Rect x="0" y="0" width="400" height="700" fill="url(#bg)" />

        {/* Water body */}
        <Path
          d="M -20 80 Q 60 60 120 90 T 240 110 Q 320 130 420 100 L 420 -20 L -20 -20 Z"
          fill="url(#water)"
          opacity={0.85}
        />

        {/* Parks / blocks */}
        <Rect x="40" y="200" width="110" height="90" rx="6" fill="url(#park)" opacity={0.9} />
        <Rect x="260" y="350" width="120" height="120" rx="6" fill="url(#park)" opacity={0.85} />
        <Rect x="20" y="500" width="100" height="80" rx="6" fill="#E2E7EC" />
        <Rect x="180" y="540" width="80" height="70" rx="6" fill="#E2E7EC" />
        <Rect x="280" y="600" width="100" height="80" rx="6" fill="#E2E7EC" />

        {/* Streets - main grid */}
        <G stroke="#FFFFFF" strokeWidth={10} strokeLinecap="round">
          <Line x1="-10" y1="180" x2="410" y2="160" />
          <Line x1="-10" y1="320" x2="410" y2="340" />
          <Line x1="-10" y1="490" x2="410" y2="500" />
          <Line x1="60" y1="-10" x2="80" y2="710" />
          <Line x1="220" y1="-10" x2="240" y2="710" />
          <Line x1="340" y1="-10" x2="360" y2="710" />
        </G>

        {/* Smaller streets */}
        <G stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" opacity={0.85}>
          <Line x1="-10" y1="260" x2="410" y2="270" />
          <Line x1="-10" y1="420" x2="410" y2="430" />
          <Line x1="-10" y1="600" x2="410" y2="610" />
          <Line x1="140" y1="-10" x2="150" y2="710" />
          <Line x1="290" y1="-10" x2="300" y2="710" />
        </G>

        {/* Diagonal road */}
        <Path
          d="M -10 700 Q 200 500 410 380"
          stroke="#FFFFFF"
          strokeWidth={8}
          fill="none"
          strokeLinecap="round"
        />

        {variant === "route" && (
          <>
            {/* Route shadow */}
            <Path
              d="M 70 540 L 75 420 Q 78 360 145 350 L 230 345 Q 240 340 240 320 L 245 220 L 240 165"
              stroke={colors.route}
              strokeWidth={9}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              opacity={0.18}
            />
            {/* Route line */}
            <Path
              d="M 70 540 L 75 420 Q 78 360 145 350 L 230 345 Q 240 340 240 320 L 245 220 L 240 165"
              stroke={colors.route}
              strokeWidth={5}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            {/* Pickup pin */}
            <Circle cx="70" cy="540" r="14" fill="#FFFFFF" />
            <Circle cx="70" cy="540" r="9" fill={colors.primary} />
            {/* Destination pin */}
            <Circle cx="240" cy="160" r="16" fill={colors.primary} />
            <Circle cx="240" cy="160" r="6" fill="#FFFFFF" />
          </>
        )}

        {variant === "drivers" && (
          <>
            {/* Center pickup */}
            <Circle cx="200" cy="350" r="22" fill={colors.primary} opacity={0.15} />
            <Circle cx="200" cy="350" r="14" fill="#FFFFFF" />
            <Circle cx="200" cy="350" r="8" fill={colors.primary} />

            {/* Driver markers */}
            <G>
              <Rect x="80" y="220" width="34" height="22" rx="6" fill="#FFFFFF" />
              <Rect x="84" y="224" width="26" height="14" rx="3" fill="#0F3F5C" />
            </G>
            <G>
              <Rect x="290" y="280" width="34" height="22" rx="6" fill="#FFFFFF" />
              <Rect x="294" y="284" width="26" height="14" rx="3" fill="#0F3F5C" />
            </G>
            <G>
              <Rect x="120" y="470" width="34" height="22" rx="6" fill="#FFFFFF" />
              <Rect x="124" y="474" width="26" height="14" rx="3" fill="#1FB57A" />
            </G>
            <G>
              <Rect x="300" y="510" width="34" height="22" rx="6" fill="#FFFFFF" />
              <Rect x="304" y="514" width="26" height="14" rx="3" fill="#0F3F5C" />
            </G>
          </>
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E8EEF1",
    overflow: "hidden",
  },
});
