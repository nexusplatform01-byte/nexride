import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Brand } from "@/components/Brand";
import { FakeMap } from "@/components/FakeMap";
import { PressableScale } from "@/components/PressableScale";
import { RideTypeIcon } from "@/components/RideTypeIcon";
import { CURRENCY, RIDE_OPTIONS } from "@/constants/rides";
import { useColors } from "@/hooks/useColors";

type Filter = "recommended" | "faster" | "cheaper";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("recommended");
  const [selected, setSelected] = useState<string>("economy");

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  const ride = RIDE_OPTIONS.find((r) => r.id === selected) ?? RIDE_OPTIONS[0];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={styles.mapContainer}>
        <FakeMap variant="route" />
      </View>

      {/* Top bar */}
      <View style={[styles.topBar, { top: topInset + 8 }]}>
        <PressableScale
          style={[styles.iconBtn, { backgroundColor: colors.card }]}
          onPress={() => router.push("/menu")}
        >
          <Feather name="menu" size={20} color={colors.foreground} />
        </PressableScale>
        <View style={[styles.brandPill, { backgroundColor: colors.card }]}>
          <Brand size={20} />
        </View>
        <PressableScale
          style={[styles.iconBtn, { backgroundColor: colors.card }]}
          onPress={() => router.push("/notifications")}
        >
          <Feather name="bell" size={18} color={colors.foreground} />
        </PressableScale>
      </View>

      {/* Destination chip */}
      <View style={[styles.destChip, { top: topInset + 78, backgroundColor: colors.card }]}>
        <View style={[styles.destDot, { backgroundColor: colors.destination }]} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.destLabel, { color: colors.mutedForeground }]}>Destination</Text>
          <Text style={[styles.destValue, { color: colors.foreground }]} numberOfLines={1}>
            Emaar Dubai Square
          </Text>
        </View>
      </View>

      {/* Pickup chip */}
      <View style={[styles.pickupChip, { backgroundColor: colors.card }]}>
        <View style={[styles.pickupDot, { backgroundColor: colors.primary }]}>
          <View style={styles.pickupDotInner} />
        </View>
        <View>
          <Text style={[styles.destLabel, { color: colors.mutedForeground }]}>Pick up point</Text>
          <Text style={[styles.destValue, { color: colors.foreground }]}>Union Coop</Text>
        </View>
      </View>

      {/* Recenter button */}
      <PressableScale
        style={[
          styles.recenter,
          {
            backgroundColor: colors.card,
            bottom: bottomSheetHeight + 12,
          },
        ]}
        onPress={() => Haptics.selectionAsync()}
      >
        <Feather name="navigation" size={18} color={colors.foreground} />
      </PressableScale>

      {/* Bottom sheet */}
      <View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.card,
            paddingBottom: 20 + bottomInset,
            shadowColor: colors.foreground,
          },
        ]}
      >
        <View style={[styles.handle, { backgroundColor: colors.border }]} />
        <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Choose a ride:</Text>

        <View style={styles.filters}>
          <FilterChip
            label="Recommended"
            icon="star"
            active={filter === "recommended"}
            onPress={() => setFilter("recommended")}
          />
          <FilterChip
            label="Faster"
            icon="zap"
            active={filter === "faster"}
            onPress={() => setFilter("faster")}
          />
          <FilterChip
            label="Cheaper"
            icon="tag"
            active={filter === "cheaper"}
            onPress={() => setFilter("cheaper")}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.ridesRow}
        >
          {RIDE_OPTIONS.slice(0, 1).map((r) => (
            <Pressable
              key={r.id}
              onPress={() => {
                setSelected(r.id);
                Haptics.selectionAsync();
              }}
              style={[
                styles.rideMini,
                {
                  borderColor: selected === r.id ? colors.primary : colors.border,
                  backgroundColor: colors.card,
                },
              ]}
            >
              <View
                style={[styles.rideIconBox, { backgroundColor: colors.secondary }]}
              >
                <RideTypeIcon type={r.id} size={26} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.rideHeaderRow}>
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
                  <Text style={[styles.rideMetaText, { color: colors.mutedForeground }]}>
                    {r.eta}
                  </Text>
                  <Text style={[styles.rideMetaText, { color: colors.mutedForeground }]}>•</Text>
                  <MaterialCommunityIcons
                    name="seat-passenger"
                    size={13}
                    color={colors.mutedForeground}
                  />
                  <Text style={[styles.rideMetaText, { color: colors.mutedForeground }]}>
                    {r.seats} Seats
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        <Pressable
          onPress={() => router.push("/ride-options")}
          style={[styles.payRow, { borderColor: colors.border }]}
        >
          <View style={styles.payRowLeft}>
            <Feather name="credit-card" size={16} color={colors.mutedForeground} />
            <Text style={[styles.payRowText, { color: colors.foreground }]}>
              Payment Method
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.payRowLeft}>
            <Feather name="tag" size={16} color={colors.mutedForeground} />
            <Text style={[styles.payRowText, { color: colors.foreground }]}>Add Promo</Text>
          </View>
        </Pressable>

        <View style={[styles.fareRow, { borderColor: colors.border }]}>
          <Pressable
            onPress={() => Haptics.selectionAsync()}
            style={[styles.fareBtn, { borderRightColor: colors.border }]}
          >
            <Feather name="minus" size={20} color={colors.foreground} />
          </Pressable>
          <View style={styles.fareCenter}>
            <Text style={[styles.fareValue, { color: colors.foreground }]}>
              {CURRENCY} {ride.price}
            </Text>
            <Text style={[styles.fareHint, { color: colors.mutedForeground }]}>
              Recomended fare: {CURRENCY} {ride.price}
            </Text>
          </View>
          <Pressable
            onPress={() => Haptics.selectionAsync()}
            style={[styles.fareBtn, { borderLeftColor: colors.border }]}
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

const bottomSheetHeight = 470;

function FilterChip({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  active: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        active
          ? { backgroundColor: colors.primary, borderColor: colors.primary }
          : { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Feather
        name={icon}
        size={13}
        color={active ? colors.primaryForeground : colors.mutedForeground}
      />
      <Text
        style={[
          styles.chipText,
          { color: active ? colors.primaryForeground : colors.foreground },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  mapContainer: { ...StyleSheet.absoluteFillObject },
  topBar: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 10,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  brandPill: {
    paddingHorizontal: 18,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  destChip: {
    position: "absolute",
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    width: 200,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  destDot: { width: 10, height: 10, borderRadius: 5 },
  destLabel: { fontSize: 10, fontFamily: "Inter_500Medium", marginBottom: 1 },
  destValue: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  pickupChip: {
    position: "absolute",
    left: 16,
    bottom: bottomSheetHeight + 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  pickupDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  pickupDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  recenter: {
    position: "absolute",
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
    paddingTop: 10,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 18,
    elevation: 12,
  },
  handle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 2,
    marginBottom: 14,
  },
  sheetTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 12 },
  filters: { flexDirection: "row", gap: 8, marginBottom: 14 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  ridesRow: { gap: 10, paddingRight: 10 },
  rideMini: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    width: "100%",
    alignItems: "center",
  },
  rideIconBox: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  rideHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rideName: { fontSize: 15, fontFamily: "Inter_700Bold" },
  ridePrice: { fontSize: 14, fontFamily: "Inter_700Bold" },
  rideDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  rideMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  rideMetaText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  payRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 14,
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
  fareBtn: {
    width: 56,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: 0,
    borderRightWidth: 0,
  },
  fareCenter: { flex: 1, alignItems: "center" },
  fareValue: { fontSize: 16, fontFamily: "Inter_700Bold" },
  fareHint: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  cta: {
    marginTop: 14,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  ctaText: { fontSize: 15, fontFamily: "Inter_700Bold", letterSpacing: 0.2 },
});
