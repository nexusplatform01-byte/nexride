import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Brand } from "@/components/Brand";
import { PressableScale } from "@/components/PressableScale";
import { RideTypeIcon } from "@/components/RideTypeIcon";
import { CURRENCY, RIDE_OPTIONS } from "@/constants/rides";
import { useColors } from "@/hooks/useColors";

type Filter = "recommended" | "faster" | "cheaper";

export default function RideOptionsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>("recommended");
  const [selected, setSelected] = useState<string>("premium");
  const [fare, setFare] = useState<number>(23);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <PressableScale
          style={[styles.iconBtn, { backgroundColor: colors.card }]}
          onPress={() => router.back()}
        >
          <Feather name="chevron-left" size={22} color={colors.foreground} />
        </PressableScale>
        <Brand size={22} />
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 240 }}>
        <Text style={[styles.title, { color: colors.foreground }]}>Choose a ride:</Text>

        <View style={styles.filters}>
          {(["recommended", "faster", "cheaper"] as Filter[]).map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[
                styles.chip,
                filter === f
                  ? { backgroundColor: colors.primary, borderColor: colors.primary }
                  : { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Feather
                name={f === "recommended" ? "star" : f === "faster" ? "zap" : "tag"}
                size={13}
                color={filter === f ? colors.primaryForeground : colors.mutedForeground}
              />
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: "Inter_600SemiBold",
                  color: filter === f ? colors.primaryForeground : colors.foreground,
                }}
              >
                {f[0].toUpperCase() + f.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={{ gap: 10, marginTop: 16 }}>
          {RIDE_OPTIONS.map((r) => {
            const active = selected === r.id;
            return (
              <Pressable
                key={r.id}
                onPress={() => {
                  setSelected(r.id);
                  setFare(r.price);
                  Haptics.selectionAsync();
                }}
                style={[
                  styles.rideRow,
                  {
                    backgroundColor: colors.card,
                    borderColor: active ? colors.primary : colors.border,
                    borderWidth: active ? 1.5 : 1,
                  },
                ]}
              >
                <View style={[styles.rideIconBox, { backgroundColor: colors.secondary }]}>
                  <RideTypeIcon type={r.id} size={28} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.rowBetween}>
                    <Text style={[styles.rideName, { color: colors.foreground }]}>{r.name}</Text>
                    <Text style={[styles.ridePrice, { color: colors.foreground }]}>
                      {CURRENCY} {r.price}
                    </Text>
                  </View>
                  <Text style={[styles.rideDesc, { color: colors.mutedForeground }]}>
                    {r.description}
                  </Text>
                  <View style={styles.rideMeta}>
                    <Feather name="clock" size={12} color={colors.mutedForeground} />
                    <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                      {r.eta}
                    </Text>
                    <Text style={[styles.metaText, { color: colors.mutedForeground }]}>•</Text>
                    <MaterialCommunityIcons
                      name="seat-passenger"
                      size={13}
                      color={colors.mutedForeground}
                    />
                    <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                      {r.seats} Seats
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom pinned action */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.card,
            paddingBottom: 18 + bottomInset,
            shadowColor: colors.foreground,
          },
        ]}
      >
        <View style={[styles.payRow, { borderColor: colors.border }]}>
          <View style={styles.payRowLeft}>
            <Feather name="credit-card" size={16} color={colors.mutedForeground} />
            <Text style={[styles.payRowText, { color: colors.foreground }]}>Payment Method</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.payRowLeft}>
            <Feather name="tag" size={16} color={colors.mutedForeground} />
            <Text style={[styles.payRowText, { color: colors.foreground }]}>Add Promo</Text>
          </View>
        </View>

        <View style={[styles.fareRow, { borderColor: colors.border }]}>
          <Pressable
            onPress={() => {
              setFare((f) => Math.max(5, f - 1));
              Haptics.selectionAsync();
            }}
            style={styles.fareBtn}
          >
            <Feather name="minus" size={20} color={colors.foreground} />
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
              setFare((f) => f + 1);
              Haptics.selectionAsync();
            }}
            style={styles.fareBtn}
          >
            <Feather name="plus" size={20} color={colors.foreground} />
          </Pressable>
        </View>

        <PressableScale
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.push("/driver-match");
          }}
          style={[styles.cta, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.ctaText, { color: colors.primaryForeground }]}>Find Riider</Text>
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  title: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 14, marginTop: 4 },
  filters: { flexDirection: "row", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  rideRow: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
  },
  rideIconBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rideName: { fontSize: 15, fontFamily: "Inter_700Bold" },
  ridePrice: { fontSize: 14, fontFamily: "Inter_700Bold" },
  rideDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  rideMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  metaText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
    paddingTop: 14,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 14,
    elevation: 10,
  },
  payRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    justifyContent: "space-between",
  },
  payRowLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  payRowText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  divider: { width: 1, height: 18, marginHorizontal: 8 },
  fareRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    marginTop: 10,
    overflow: "hidden",
  },
  fareBtn: { width: 56, paddingVertical: 14, alignItems: "center", justifyContent: "center" },
  fareCenter: { flex: 1, alignItems: "center" },
  fareValue: { fontSize: 16, fontFamily: "Inter_700Bold" },
  fareHint: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  cta: { marginTop: 14, paddingVertical: 16, borderRadius: 14, alignItems: "center" },
  ctaText: { fontSize: 15, fontFamily: "Inter_700Bold", letterSpacing: 0.2 },
});
