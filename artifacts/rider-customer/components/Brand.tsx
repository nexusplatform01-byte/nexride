import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

export function Brand({ size = 22 }: { size?: number }) {
  const colors = useColors();
  return (
    <View style={styles.row}>
      <Text style={[styles.text, { color: colors.primary, fontSize: size }]}>r</Text>
      <View
        style={[
          styles.dot,
          {
            width: size * 0.42,
            height: size * 0.42,
            borderRadius: size * 0.21,
            backgroundColor: colors.primary,
            marginHorizontal: 1,
            marginBottom: size * 0.18,
          },
        ]}
      />
      <Text style={[styles.text, { color: colors.primary, fontSize: size }]}>der</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-end" },
  text: {
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    lineHeight: undefined,
  },
  dot: { alignSelf: "flex-end" },
});
