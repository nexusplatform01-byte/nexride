import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PressableScale } from "@/components/PressableScale";
import { WebMap } from "@/components/WebMap";
import { LatLng } from "@/constants/gulu";
import { CURRENCY } from "@/constants/rides";
import { useOSRM } from "@/hooks/useOSRM";
import { useColors } from "@/hooks/useColors";

type Phase = "searching" | "matched" | "confirmed";

const MOCK_RIDER = {
  name: "Okello James",
  initials: "OJ",
  rating: 4.8,
  trips: 1247,
  plateNumber: "UBF 234A",
  bikeModel: "Yamaha YBR 125",
  bikeColor: "Blue & Silver",
  phone: "0772 456 789",
  distanceKm: 0.8,
  etaMin: 3,
  lat: 2.7840,
  lng: 32.3025,
};

const WEB_TAB_BAR_H = 84;

export default function DriverMatchScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    fare: string;
    rideType: string;
    distKm: string;
    durationMin: string;
    destName: string;
    pickupName: string;
    pickupLat: string;
    pickupLng: string;
  }>();

  const fare = parseInt(params.fare ?? "3000");
  const distKm = parseFloat(params.distKm ?? "0");
  const durationMin = parseInt(params.durationMin ?? "0");
  const pickupLat = parseFloat(params.pickupLat ?? "2.7749");
  const pickupLng = parseFloat(params.pickupLng ?? "32.299");
  const pickupName = params.pickupName ?? "Gulu City Center";

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? WEB_TAB_BAR_H : insets.bottom;

  const debugPhase = params.phase as Phase | undefined;
  const [phase, setPhase] = useState<Phase>(debugPhase ?? "searching");
  const pulse = useRef(new Animated.Value(0)).current;
  const dotAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(debugPhase === "matched" ? 1 : 0)).current;

  const customerLocation: LatLng = { lat: pickupLat, lng: pickupLng };

  // Live rider position — animates toward customer every second
  const [riderPos, setRiderPos] = useState<LatLng>({ lat: MOCK_RIDER.lat, lng: MOCK_RIDER.lng });
  const [etaSecondsLeft, setEtaSecondsLeft] = useState(MOCK_RIDER.etaMin * 60);
  const riderPosRef = useRef<LatLng>({ lat: MOCK_RIDER.lat, lng: MOCK_RIDER.lng });

  const { route: riderRoute, fetchRoute } = useOSRM();

  // ── Real-time rider movement: 1 step every second ────────────────────────
  useEffect(() => {
    if (phase !== "matched") return;

    // Total travel time: etaMin minutes
    const totalSeconds = MOCK_RIDER.etaMin * 60;
    let elapsed = 0;

    const moveInterval = setInterval(() => {
      elapsed += 1;
      const progress = Math.min(elapsed / totalSeconds, 1);

      const newPos: LatLng = {
        lat: MOCK_RIDER.lat + (customerLocation.lat - MOCK_RIDER.lat) * progress,
        lng: MOCK_RIDER.lng + (customerLocation.lng - MOCK_RIDER.lng) * progress,
      };
      setRiderPos(newPos);
      riderPosRef.current = newPos;
      setEtaSecondsLeft(Math.max(0, totalSeconds - elapsed));

      if (progress >= 1) clearInterval(moveInterval);
    }, 1000);

    return () => clearInterval(moveInterval);
  }, [phase]);

  // ── Route refresh every 5 seconds as rider moves ─────────────────────────
  useEffect(() => {
    if (phase !== "matched") return;

    // Fetch immediately on match
    fetchRoute(riderPosRef.current, customerLocation);

    const routeInterval = setInterval(() => {
      fetchRoute(riderPosRef.current, customerLocation);
    }, 5000);

    return () => clearInterval(routeInterval);
  }, [phase]);

  const nativeDriver = Platform.OS !== "web";

  useEffect(() => {
    // Pulse animation for searching
    Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: nativeDriver,
      })
    ).start();

    // Dots animation
    Animated.loop(
      Animated.timing(dotAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: nativeDriver,
      })
    ).start();

    // Auto-match after 3.5 seconds
    const t = setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPhase("matched");
      // Fetch route from rider → customer
      fetchRoute(riderLocation, customerLocation);
      // Slide up card
      Animated.spring(cardAnim, {
        toValue: 1,
        tension: 70,
        friction: 12,
        useNativeDriver: nativeDriver,
      }).start();
    }, 3500);

    return () => clearTimeout(t);
  }, []);

  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.8] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] });
  const cardTranslateY = cardAnim.interpolate({ inputRange: [0, 1], outputRange: [300, 0] });

  const handleConfirm = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPhase("confirmed");
    setTimeout(() => router.replace("/"), 1200);
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.back();
  };

  const handleCall = () => {
    Haptics.selectionAsync();
    if (Platform.OS !== "web") {
      Linking.openURL(`tel:${MOCK_RIDER.phone}`);
    }
  };

  // ETA string for display — live countdown
  const etaMin = Math.floor(etaSecondsLeft / 60);
  const etaSec = etaSecondsLeft % 60;
  const etaLabel =
    etaSecondsLeft <= 0
      ? "Arriving now"
      : etaMin > 0
      ? `${etaMin}m ${etaSec.toString().padStart(2, "0")}s`
      : `${etaSec}s`;

  // Map center tracks midpoint between live rider position and customer
  const mapCenter: LatLng =
    phase === "searching"
      ? customerLocation
      : { lat: (customerLocation.lat + riderPos.lat) / 2, lng: (customerLocation.lng + riderPos.lng) / 2 };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* FULL SCREEN MAP */}
      <View style={styles.mapFill}>
        <WebMap
          pickup={customerLocation}
          riderLocation={phase !== "searching" ? riderPos : undefined}
          routeCoords={phase !== "searching" ? riderRoute?.coords : undefined}
          center={mapCenter}
          zoom={16}
          fitBoundsOnRoute={false}
        />
      </View>

      {/* Back button */}
      <View style={[styles.backRow, { top: topInset + 8 }]}>
        <PressableScale
          style={[styles.iconBtn, { backgroundColor: colors.card }]}
          onPress={() => router.back()}
        >
          <Feather name="chevron-left" size={22} color={colors.foreground} />
        </PressableScale>

        {phase !== "searching" && (
          <View style={[styles.statusPill, { backgroundColor: colors.primary }]}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Rider Found</Text>
          </View>
        )}
      </View>

      {/* ══════════ SEARCHING PHASE ══════════ */}
      {phase === "searching" && (
        <>
          {/* Pulsing pickup indicator on map */}
          <View style={styles.pulseWrap}>
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  backgroundColor: colors.primary,
                  opacity: pulseOpacity,
                  transform: [{ scale: pulseScale }],
                },
              ]}
            />
            <View style={[styles.pulseCore, { backgroundColor: colors.primary, borderColor: colors.card }]} />
          </View>

          {/* Bottom searching card */}
          <View
            style={[
              styles.searchingCard,
              { backgroundColor: colors.card, paddingBottom: 20 + bottomInset, shadowColor: colors.foreground },
            ]}
          >
            <View style={[styles.handle, { backgroundColor: colors.border }]} />

            <View style={styles.searchingHeader}>
              <View style={[styles.searchingIconWrap, { backgroundColor: colors.secondary }]}>
                <MaterialCommunityIcons name="motorbike" size={28} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.searchingTitle, { color: colors.foreground }]}>
                  Searching for Boda-Boda
                </Text>
                <View style={styles.dotsRow}>
                  <Text style={[styles.searchingSub, { color: colors.mutedForeground }]}>
                    Finding nearest rider
                  </Text>
                  <LoadingDots anim={dotAnim} color={colors.primary} />
                </View>
              </View>
            </View>

            <View style={[styles.tripInfoRow, { borderColor: colors.border }]}>
              <InfoChip
                icon="map"
                label={params.destName || "Destination"}
                value={distKm > 0 ? `${distKm} km` : "—"}
                colors={colors}
              />
              <View style={[styles.infoSep, { backgroundColor: colors.border }]} />
              <InfoChip
                icon="clock"
                label="Duration"
                value={durationMin > 0 ? `~${durationMin} min` : "—"}
                colors={colors}
              />
              <View style={[styles.infoSep, { backgroundColor: colors.border }]} />
              <InfoChip
                icon="tag"
                label="Fare"
                value={fare > 0 ? `${CURRENCY} ${fare.toLocaleString()}` : "—"}
                colors={colors}
              />
            </View>

            <Pressable
              onPress={handleCancel}
              style={[styles.cancelBtn, { borderColor: colors.border }]}
            >
              <Text style={[styles.cancelText, { color: colors.foreground }]}>Cancel Request</Text>
            </Pressable>
          </View>
        </>
      )}

      {/* ══════════ MATCHED PHASE ══════════ */}
      {phase === "matched" && (
        <Animated.View
          style={[
            styles.matchedCard,
            {
              backgroundColor: colors.card,
              bottom: bottomInset,
              shadowColor: colors.foreground,
              transform: [{ translateY: cardTranslateY }],
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {/* ── Rider Profile ── */}
          <View style={styles.riderProfile}>
            {/* Avatar */}
            <View style={[styles.avatarWrap, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarInitials}>{MOCK_RIDER.initials}</Text>
              <View style={[styles.onlineDot, { borderColor: colors.card }]} />
            </View>

            {/* Info */}
            <View style={{ flex: 1 }}>
              <View style={styles.riderNameRow}>
                <Text style={[styles.riderName, { color: colors.foreground }]}>
                  {MOCK_RIDER.name}
                </Text>
                <View style={[styles.ratingBadge, { backgroundColor: "#FFF8E1" }]}>
                  <Text style={styles.ratingStar}>⭐</Text>
                  <Text style={[styles.ratingValue, { color: "#B8860B" }]}>{MOCK_RIDER.rating}</Text>
                </View>
              </View>
              <Text style={[styles.tripCount, { color: colors.mutedForeground }]}>
                {MOCK_RIDER.trips.toLocaleString()} trips completed
              </Text>

              <View style={styles.etaRow}>
                <View style={[styles.etaBadge, { backgroundColor: colors.secondary }]}>
                  <MaterialCommunityIcons name="motorbike" size={12} color={colors.primary} />
                  <Text style={[styles.etaText, { color: colors.primary }]}>
                    {MOCK_RIDER.etaMin} min away
                  </Text>
                </View>
                <View style={[styles.etaBadge, { backgroundColor: colors.secondary }]}>
                  <Feather name="map-pin" size={11} color={colors.primary} />
                  <Text style={[styles.etaText, { color: colors.primary }]}>
                    {MOCK_RIDER.distanceKm} km
                  </Text>
                </View>
              </View>
            </View>

            {/* Fare */}
            <View style={[styles.fareTag, { backgroundColor: colors.primary }]}>
              <Text style={[styles.fareTagSub, { color: "rgba(255,255,255,0.7)" }]}>Fare</Text>
              <Text style={[styles.fareTagValue, { color: colors.primaryForeground }]}>
                {fare > 0 ? fare.toLocaleString() : MOCK_RIDER.distanceKm * 900}
              </Text>
              <Text style={[styles.fareTagCurrency, { color: "rgba(255,255,255,0.8)" }]}>UGX</Text>
            </View>
          </View>

          {/* ── Bike Details ── */}
          <View style={[styles.bikeCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.bikeRow}>
              <View style={[styles.bikeIconBox, { backgroundColor: colors.secondary }]}>
                <MaterialCommunityIcons name="motorbike" size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.bikeModel, { color: colors.foreground }]}>
                  {MOCK_RIDER.bikeModel}
                </Text>
                <Text style={[styles.bikeColor, { color: colors.mutedForeground }]}>
                  {MOCK_RIDER.bikeColor}
                </Text>
              </View>
              <View style={[styles.plateBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.plateLabel, { color: colors.mutedForeground }]}>PLATE</Text>
                <Text style={[styles.plateNumber, { color: colors.foreground }]}>
                  {MOCK_RIDER.plateNumber}
                </Text>
              </View>
            </View>

            <View style={[styles.safetyHint, { backgroundColor: "#FFF8E1" }]}>
              <Feather name="shield" size={12} color="#B8860B" />
              <Text style={[styles.safetyText, { color: "#B8860B" }]}>
                Verify: plate number must match before boarding
              </Text>
            </View>
          </View>

          {/* ── 3 Action Buttons ── */}
          <View style={styles.actionRow}>
            <Pressable
              onPress={handleCall}
              style={[styles.actionBtnRound, { backgroundColor: "#E8F5E9" }]}
            >
              <Feather name="phone" size={20} color="#2E7D32" />
              <Text style={[styles.actionLabel, { color: "#2E7D32" }]}>Call</Text>
            </Pressable>

            <Pressable
              onPress={handleCancel}
              style={[styles.actionBtnRound, { backgroundColor: colors.background, borderWidth: 1.5, borderColor: colors.border }]}
            >
              <Feather name="x" size={20} color={colors.destructive} />
              <Text style={[styles.actionLabel, { color: colors.destructive }]}>Cancel</Text>
            </Pressable>

            <PressableScale
              onPress={handleConfirm}
              style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
            >
              <Feather name="check" size={18} color={colors.primaryForeground} />
              <Text style={[styles.confirmText, { color: colors.primaryForeground }]}>
                Confirm Ride
              </Text>
            </PressableScale>
          </View>
        </Animated.View>
      )}

      {/* ══════════ CONFIRMED ══════════ */}
      {phase === "confirmed" && (
        <View style={styles.confirmedOverlay}>
          <View style={[styles.confirmedBox, { backgroundColor: colors.card }]}>
            <View style={[styles.confirmedIcon, { backgroundColor: "#E8F5E9" }]}>
              <Feather name="check-circle" size={40} color="#2E7D32" />
            </View>
            <Text style={[styles.confirmedTitle, { color: colors.foreground }]}>Ride Confirmed!</Text>
            <Text style={[styles.confirmedSub, { color: colors.mutedForeground }]}>
              {MOCK_RIDER.name} is on the way
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

function LoadingDots({ anim, color }: { anim: Animated.Value; color: string }) {
  return (
    <View style={{ flexDirection: "row", marginLeft: 6, alignItems: "center" }}>
      {[0, 1, 2].map((i) => {
        const opacity = anim.interpolate({
          inputRange: [0, 0.3 + i * 0.15, 0.6 + i * 0.15, 1],
          outputRange: [0.25, 1, 0.25, 0.25],
        });
        return (
          <Animated.View
            key={i}
            style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: color, marginHorizontal: 2, opacity }}
          />
        );
      })}
    </View>
  );
}

function InfoChip({
  icon,
  label,
  value,
  colors,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  colors: any;
}) {
  return (
    <View style={styles.infoChip}>
      <Feather name={icon} size={13} color={colors.primary} />
      <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  mapFill: { ...StyleSheet.absoluteFillObject },

  backRow: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    zIndex: 20,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#4ade80" },
  statusText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#FFFFFF" },

  pulseWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
  } as any,
  pulseRing: { position: "absolute", width: 32, height: 32, borderRadius: 16 },
  pulseCore: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
  },

  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, marginBottom: 14 },

  searchingCard: {
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
    elevation: 14,
    zIndex: 10,
  },
  searchingHeader: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 16 },
  searchingIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  searchingTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  dotsRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  searchingSub: { fontSize: 13, fontFamily: "Inter_400Regular" },

  tripInfoRow: {
    flexDirection: "row",
    alignItems: "stretch",
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 14,
    overflow: "hidden",
  },
  infoChip: { flex: 1, alignItems: "center", paddingVertical: 12, gap: 3 },
  infoSep: { width: 1 },
  infoLabel: { fontSize: 10, fontFamily: "Inter_500Medium" },
  infoValue: { fontSize: 12, fontFamily: "Inter_700Bold" },

  cancelBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
  },
  cancelText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },

  matchedCard: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 20,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: -6 },
    shadowRadius: 24,
    elevation: 18,
    zIndex: 20,
  },

  riderProfile: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 14 },
  avatarWrap: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  avatarInitials: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  onlineDot: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#4ade80",
    borderWidth: 2,
  },

  riderNameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  riderName: { fontSize: 16, fontFamily: "Inter_700Bold" },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ratingStar: { fontSize: 11 },
  ratingValue: { fontSize: 12, fontFamily: "Inter_700Bold" },
  tripCount: { fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 6 },

  etaRow: { flexDirection: "row", gap: 6 },
  etaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  etaText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },

  fareTag: {
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    minWidth: 70,
  },
  fareTagSub: { fontSize: 9, fontFamily: "Inter_500Medium" },
  fareTagValue: { fontSize: 16, fontFamily: "Inter_700Bold" },
  fareTagCurrency: { fontSize: 9, fontFamily: "Inter_500Medium" },

  bikeCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
  },
  bikeRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  bikeIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  bikeModel: { fontSize: 14, fontFamily: "Inter_700Bold" },
  bikeColor: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  plateBadge: {
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  plateLabel: { fontSize: 8, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  plateNumber: { fontSize: 14, fontFamily: "Inter_700Bold", letterSpacing: 1 },

  safetyHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  safetyText: { fontSize: 11, fontFamily: "Inter_500Medium", flex: 1 },

  actionRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  actionBtnRound: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  actionLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  confirmBtn: {
    flex: 1,
    height: 64,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  confirmText: { fontSize: 15, fontFamily: "Inter_700Bold" },

  confirmedOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    zIndex: 30,
  },
  confirmedBox: {
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    gap: 12,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    elevation: 16,
  },
  confirmedIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  confirmedTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  confirmedSub: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
