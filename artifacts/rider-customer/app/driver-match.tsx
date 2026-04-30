import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FakeMap } from "@/components/FakeMap";
import { PressableScale } from "@/components/PressableScale";
import { CURRENCY } from "@/constants/rides";
import { useColors } from "@/hooks/useColors";

export default function DriverMatchScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [fare, setFare] = useState<number>(23);
  const [matched, setMatched] = useState<boolean>(false);

  const pulse = useRef(new Animated.Value(0)).current;
  const dotAnim = useRef(new Animated.Value(0)).current;

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ).start();
    Animated.loop(
      Animated.timing(dotAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [pulse, dotAnim]);

  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] });

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.mapBg}>
        <FakeMap variant="drivers" />
      </View>

      {/* Top driver card */}
      <View style={[styles.topCard, { top: topInset + 8 }]}>
        <PressableScale
          style={[styles.iconBtn, { backgroundColor: colors.card }]}
          onPress={() => router.back()}
        >
          <Feather name="chevron-left" size={22} color={colors.foreground} />
        </PressableScale>

        <View style={[styles.driverCard, { backgroundColor: colors.card }]}>
          <View style={styles.driverHeader}>
            <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
              <MaterialCommunityIcons name="car-side" size={26} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.rowBetween}>
                <Text style={[styles.driverName, { color: colors.foreground }]}>
                  Sayeed Husein
                </Text>
                <View style={[styles.priceBadge, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.priceBadgeText, { color: colors.primary }]}>
                    {CURRENCY} 26
                  </Text>
                </View>
              </View>
              <Text style={[styles.driverCar, { color: colors.mutedForeground }]}>
                White Lexus E5300H
              </Text>
              <View style={styles.driverMeta}>
                <Feather name="clock" size={12} color={colors.mutedForeground} />
                <Text style={[styles.metaText, { color: colors.mutedForeground }]}>3 mins</Text>
                <Text style={[styles.metaText, { color: colors.mutedForeground }]}>•</Text>
                <Feather name="map-pin" size={12} color={colors.mutedForeground} />
                <Text style={[styles.metaText, { color: colors.mutedForeground }]}>0.5 km</Text>
              </View>
            </View>
          </View>

          <View style={styles.actionRow}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.back();
              }}
              style={[
                styles.actionBtn,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.actionText, { color: colors.foreground }]}>Decline</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setMatched(true);
                setTimeout(() => router.replace("/"), 800);
              }}
              style={[styles.actionBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.actionText, { color: colors.primaryForeground }]}>
                {matched ? "Matched" : "Accept"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Pulse over center pickup */}
      <View pointerEvents="none" style={styles.pulseWrap}>
        <Animated.View
          style={[
            styles.pulse,
            {
              backgroundColor: colors.primary,
              opacity: pulseOpacity,
              transform: [{ scale: pulseScale }],
            },
          ]}
        />
      </View>

      {/* Locating banner */}
      <View
        style={[
          styles.bottomCard,
          {
            backgroundColor: colors.card,
            paddingBottom: 18 + bottomInset,
            shadowColor: colors.foreground,
          },
        ]}
      >
        <View style={[styles.viewerRow, { backgroundColor: colors.background }]}>
          <View style={styles.avatarsRow}>
            {[colors.primary, "#1FB57A", colors.warning].map((c, i) => (
              <View
                key={i}
                style={[
                  styles.miniAvatar,
                  {
                    backgroundColor: c,
                    marginLeft: i === 0 ? 0 : -10,
                    borderColor: colors.card,
                  },
                ]}
              />
            ))}
          </View>
          <Text style={[styles.viewerText, { color: colors.foreground }]}>
            1 Drivers are viewing your request
          </Text>
        </View>

        <View style={styles.locatingRow}>
          <Text style={[styles.locatingText, { color: colors.foreground }]}>
            Locating driver nearby
          </Text>
          <LoadingDots anim={dotAnim} color={colors.primary} />
        </View>

        <View style={[styles.fareRow, { borderColor: colors.border }]}>
          <Pressable
            onPress={() => {
              setFare((f) => Math.max(5, f - 5));
              Haptics.selectionAsync();
            }}
            style={styles.fareBtn}
          >
            <Text style={[styles.fareBtnText, { color: colors.foreground }]}>-5</Text>
          </Pressable>
          <View style={styles.fareCenter}>
            <Text style={[styles.fareValue, { color: colors.foreground }]}>
              {CURRENCY} {fare}
            </Text>
            <Text style={[styles.fareHint, { color: colors.mutedForeground }]}>
              Recomended fare: {CURRENCY} 23
            </Text>
          </View>
          <Pressable
            onPress={() => {
              setFare((f) => f + 5);
              Haptics.selectionAsync();
            }}
            style={styles.fareBtn}
          >
            <Text style={[styles.fareBtnText, { color: colors.foreground }]}>+5</Text>
          </Pressable>
        </View>

        <Pressable
          style={[styles.raiseBtn, { backgroundColor: colors.muted }]}
          onPress={() => {
            setFare((f) => f + 5);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <Text style={[styles.raiseText, { color: colors.mutedForeground }]}>Raise Fare</Text>
        </Pressable>
      </View>
    </View>
  );
}

function LoadingDots({ anim, color }: { anim: Animated.Value; color: string }) {
  const dots = [0, 1, 2].map((i) => {
    const opacity = anim.interpolate({
      inputRange: [0, 0.3 + i * 0.15, 0.6 + i * 0.15, 1],
      outputRange: [0.3, 1, 0.3, 0.3],
    });
    return (
      <Animated.View
        key={i}
        style={{
          width: 5,
          height: 5,
          borderRadius: 3,
          backgroundColor: color,
          marginHorizontal: 2,
          opacity,
        }}
      />
    );
  });
  return <View style={{ flexDirection: "row", marginLeft: 8 }}>{dots}</View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  mapBg: { ...StyleSheet.absoluteFillObject },
  topCard: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    zIndex: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  driverCard: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 14,
    elevation: 4,
  },
  driverHeader: { flexDirection: "row", gap: 12, alignItems: "center" },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  driverName: { fontSize: 14, fontFamily: "Inter_700Bold" },
  priceBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  priceBadgeText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  driverCar: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  driverMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  metaText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  actionBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  actionText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  pulseWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  pulse: { width: 28, height: 28, borderRadius: 14 },
  bottomCard: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 14,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 14,
    elevation: 10,
  },
  viewerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  avatarsRow: { flexDirection: "row" },
  miniAvatar: { width: 22, height: 22, borderRadius: 11, borderWidth: 2 },
  viewerText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  locatingRow: { flexDirection: "row", alignItems: "center", marginTop: 14, marginBottom: 10 },
  locatingText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  fareRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  fareBtn: { width: 64, paddingVertical: 14, alignItems: "center", justifyContent: "center" },
  fareBtnText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  fareCenter: { flex: 1, alignItems: "center" },
  fareValue: { fontSize: 16, fontFamily: "Inter_700Bold" },
  fareHint: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  raiseBtn: {
    marginTop: 12,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  raiseText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
