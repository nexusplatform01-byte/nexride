import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Brand } from "@/components/Brand";
import { PressableScale } from "@/components/PressableScale";
import { RideTypeIcon } from "@/components/RideTypeIcon";
import { WebMap } from "@/components/WebMap";
import {
  calcFare,
  GULU_CENTER,
  NamedLocation,
  NEARBY_RIDERS,
  PICKUP_LOCATION,
  POPULAR_PLACES,
} from "@/constants/gulu";
import { CURRENCY, RIDE_OPTIONS } from "@/constants/rides";
import { useNominatim } from "@/hooks/useNominatim";
import { useOSRM } from "@/hooks/useOSRM";
import { useColors } from "@/hooks/useColors";

type Phase = "idle" | "searching" | "route";

const WEB_TAB_BAR_H = 84;

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const tabBarH = Platform.OS === "web" ? WEB_TAB_BAR_H : insets.bottom + 49;

  const [phase, setPhase] = useState<Phase>("idle");
  const [query, setQuery] = useState("");
  const [destination, setDestination] = useState<NamedLocation | null>(null);
  const [pickupLocation, setPickupLocation] = useState<NamedLocation>(PICKUP_LOCATION);
  const [selectedRide, setSelectedRide] = useState("motorbike");
  const [offerFare, setOfferFare] = useState(0);

  const { results, loading: searchLoading, search, clear } = useNominatim();
  const { route, loading: routeLoading, fetchRoute, clearRoute } = useOSRM();
  const recenterRef = useRef<((lat: number, lng: number, zoom?: number) => void) | null>(null);
  // locateMeRef is populated by WebMap whenever a fresh GPS fix arrives
  const locateMeRef = useRef<(() => void) | null>(null);
  const inputRef = useRef<TextInput>(null);

  const baseFare = route ? calcFare(route.distanceKm, selectedRide) : 0;

  useEffect(() => {
    setOfferFare(baseFare);
  }, [baseFare]);

  useEffect(() => {
    if (phase === "searching") {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [phase]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (query.length >= 2) search(query);
      else clear();
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  const handleLocationFound = useCallback((lat: number, lng: number) => {
    setPickupLocation({ lat, lng, name: "Your location" });
  }, []);

  const selectDestination = useCallback(
    async (place: NamedLocation) => {
      Haptics.selectionAsync();
      setDestination(place);
      setPhase("route");
      setQuery("");
      clear();
      await fetchRoute(pickupLocation, place);
    },
    [fetchRoute, clear, pickupLocation]
  );

  const handleMapTap = useCallback(
    async (lat: number, lng: number) => {
      if (phase !== "searching" && phase !== "idle") return;
      const place: NamedLocation = { lat, lng, name: "Pinned location" };
      Haptics.selectionAsync();
      setDestination(place);
      setPhase("route");
      setQuery("");
      clear();
      await fetchRoute(pickupLocation, place);
    },
    [phase, fetchRoute, clear, pickupLocation]
  );

  const resetJourney = () => {
    setPhase("idle");
    setDestination(null);
    setQuery("");
    clearRoute();
    clear();
  };

  const suggestions = query.length >= 2 ? results : POPULAR_PLACES;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* MAP — always full screen behind */}
      <View style={styles.mapFill}>
        <WebMap
          pickup={pickupLocation}
          destination={destination ?? undefined}
          routeCoords={route?.coords}
          onTap={handleMapTap}
          onLocationFound={handleLocationFound}
          recenterRef={recenterRef}
          locateMeRef={locateMeRef}
          center={GULU_CENTER}
          showRiders={phase === "idle"}
          nearbyRiders={NEARBY_RIDERS}
        />
      </View>

      {/* ══════════════ IDLE PHASE ══════════════ */}
      {phase === "idle" && (
        <>
          {/* Top bar */}
          <View style={[styles.topBar, { top: topInset + 8 }]}>
            <PressableScale style={[styles.iconBtn, { backgroundColor: colors.card }]}>
              <Feather name="menu" size={20} color={colors.foreground} />
            </PressableScale>
            <View style={[styles.brandPill, { backgroundColor: colors.card }]}>
              <Brand size={20} />
            </View>
            <PressableScale style={[styles.iconBtn, { backgroundColor: colors.card }]}>
              <Feather name="bell" size={18} color={colors.foreground} />
            </PressableScale>
          </View>

          {/* Where to pill */}
          <Pressable
            onPress={() => setPhase("searching")}
            style={[
              styles.whereToPill,
              { top: topInset + 70, backgroundColor: colors.card },
            ]}
          >
            <View style={[styles.whereToIcon, { backgroundColor: colors.secondary }]}>
              <Feather name="search" size={16} color={colors.primary} />
            </View>
            <Text style={[styles.whereToText, { color: colors.mutedForeground }]}>
              Where to?
            </Text>
            <View style={[styles.whereToArrow, { backgroundColor: colors.primary }]}>
              <Feather name="arrow-right" size={14} color={colors.primaryForeground} />
            </View>
          </Pressable>

          {/* Locate Me button */}
          <PressableScale
            style={[
              styles.recenter,
              { backgroundColor: "#fff", bottom: tabBarH + 100 },
            ]}
            onPress={() => locateMeRef.current?.()}
          >
            {/* Outer ring */}
            <View style={styles.locateDotRing}>
              {/* Filled blue dot */}
              <View style={styles.locateDotInner} />
            </View>
            {/* Crosshair lines */}
            <View style={[styles.crossH, { backgroundColor: "#1a73e8" }]} />
            <View style={[styles.crossV, { backgroundColor: "#1a73e8" }]} />
          </PressableScale>

          {/* Quick destinations — sits just ABOVE the tab bar */}
          <View
            style={[
              styles.idleSheet,
              {
                backgroundColor: colors.card,
                bottom: tabBarH,
                shadowColor: colors.foreground,
              },
            ]}
          >
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <View style={styles.ridersBadgeRow}>
              <MaterialCommunityIcons name="motorbike" size={16} color={colors.primary} />
              <Text style={[styles.ridersText, { color: colors.primary }]}>
                {NEARBY_RIDERS.filter((r) => r.type === "motorbike").length} boda-bodas nearby
              </Text>
              <Text style={[styles.ridersDot, { color: colors.border }]}>•</Text>
              <MaterialCommunityIcons name="car-outline" size={14} color={colors.mutedForeground} />
              <Text style={[styles.ridersTextSub, { color: colors.mutedForeground }]}>
                {NEARBY_RIDERS.filter((r) => r.type === "car").length} cars
              </Text>
            </View>
            <Text style={[styles.idleTitle, { color: colors.foreground }]}>
              Quick destinations
            </Text>
            <FlatList
              data={POPULAR_PLACES.slice(0, 5)}
              keyExtractor={(item) => item.name}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickRow}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => selectDestination(item)}
                  style={[
                    styles.quickChip,
                    { borderColor: colors.border, backgroundColor: colors.background },
                  ]}
                >
                  <Feather name="map-pin" size={12} color={colors.primary} />
                  <Text
                    style={[styles.quickText, { color: colors.foreground }]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </>
      )}

      {/* ══════════════ SEARCHING PHASE ══════════════ */}
      {phase === "searching" && (
        <View style={[styles.searchOverlay, { backgroundColor: colors.background }]}>
          <View
            style={[
              styles.searchHeader,
              { paddingTop: topInset + 12, backgroundColor: colors.card },
            ]}
          >
            <Pressable
              onPress={resetJourney}
              style={[styles.backBtn, { backgroundColor: colors.background }]}
            >
              <Feather name="arrow-left" size={20} color={colors.foreground} />
            </Pressable>
            <View
              style={[
                styles.searchInputWrap,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
            >
              <View style={[styles.searchDot, { backgroundColor: colors.destination }]} />
              <TextInput
                ref={inputRef}
                value={query}
                onChangeText={setQuery}
                placeholder="Search destination in Gulu…"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.searchInput, { color: colors.foreground }]}
                returnKeyType="search"
              />
              {(query.length > 0 || searchLoading) && (
                <Pressable onPress={() => setQuery("")}>
                  {searchLoading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Feather name="x" size={16} color={colors.mutedForeground} />
                  )}
                </Pressable>
              )}
            </View>
          </View>

          {/* From row */}
          <View
            style={[styles.fromRow, { borderBottomColor: colors.border, backgroundColor: colors.card }]}
          >
            <View style={[styles.fromDot, { backgroundColor: colors.primary }]}>
              <View style={styles.fromDotInner} />
            </View>
            <View>
              <Text style={[styles.fromLabel, { color: colors.mutedForeground }]}>From</Text>
              <Text style={[styles.fromValue, { color: colors.foreground }]}>
                {pickupLocation.name}
              </Text>
            </View>
          </View>

          <FlatList
            data={suggestions as NamedLocation[]}
            keyExtractor={(item) => String((item as any).place_id ?? item.name)}
            contentContainerStyle={styles.suggestionList}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              query.length < 2 ? (
                <>
                  <TouchableOpacity
                    onPress={() => {
                      recenterRef.current?.(pickupLocation.lat, pickupLocation.lng);
                      setPhase("idle");
                    }}
                    style={[styles.sugItem, { borderBottomColor: colors.border }]}
                  >
                    <View style={[styles.sugIcon, { backgroundColor: colors.secondary }]}>
                      <Feather name="crosshair" size={16} color={colors.primary} />
                    </View>
                    <View>
                      <Text style={[styles.sugName, { color: colors.foreground }]}>
                        Your location
                      </Text>
                      <Text style={[styles.sugSub, { color: colors.mutedForeground }]}>
                        {pickupLocation.name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setPhase("idle")}
                    style={[styles.sugItem, { borderBottomColor: colors.border }]}
                  >
                    <View style={[styles.sugIcon, { backgroundColor: colors.secondary }]}>
                      <Feather name="map" size={16} color={colors.primary} />
                    </View>
                    <View>
                      <Text style={[styles.sugName, { color: colors.foreground }]}>
                        Set on map
                      </Text>
                      <Text style={[styles.sugSub, { color: colors.mutedForeground }]}>
                        Tap anywhere on the Gulu map
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                    Popular places in Gulu
                  </Text>
                </>
              ) : null
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => selectDestination(item as NamedLocation)}
                style={[styles.sugItem, { borderBottomColor: colors.border }]}
              >
                <View style={[styles.sugIcon, { backgroundColor: colors.secondary }]}>
                  <Feather name="map-pin" size={16} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.sugName, { color: colors.foreground }]}
                    numberOfLines={1}
                  >
                    {(item as NamedLocation).name}
                  </Text>
                  {(item as any).display_name && (
                    <Text
                      style={[styles.sugSub, { color: colors.mutedForeground }]}
                      numberOfLines={1}
                    >
                      {(item as any).display_name}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* ══════════════ ROUTE PHASE ══════════════ */}
      {phase === "route" && (
        <>
          <View style={[styles.topBar, { top: topInset + 8 }]}>
            <PressableScale
              style={[styles.iconBtn, { backgroundColor: colors.card }]}
              onPress={resetJourney}
            >
              <Feather name="arrow-left" size={20} color={colors.foreground} />
            </PressableScale>
            <View style={[styles.brandPill, { backgroundColor: colors.card }]}>
              <Brand size={20} />
            </View>
            <PressableScale
              style={[styles.iconBtn, { backgroundColor: colors.card }]}
              onPress={() =>
                recenterRef.current?.(pickupLocation.lat, pickupLocation.lng)
              }
            >
              <Feather name="navigation" size={18} color={colors.primary} />
            </PressableScale>
          </View>

          <View
            style={[
              styles.routeSheet,
              {
                backgroundColor: colors.card,
                bottom: tabBarH,
                shadowColor: colors.foreground,
              },
            ]}
          >
            <View style={[styles.handle, { backgroundColor: colors.border }]} />

            {/* Location rows */}
            <Pressable
              onPress={resetJourney}
              style={[styles.locRow, { borderBottomColor: colors.border }]}
            >
              <View style={[styles.locDotPickup, { backgroundColor: colors.primary }]}>
                <View style={styles.locDotInner} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.locLabel, { color: colors.mutedForeground }]}>Pickup</Text>
                <Text style={[styles.locValue, { color: colors.foreground }]} numberOfLines={1}>
                  {pickupLocation.name}
                </Text>
              </View>
              <Feather name="edit-2" size={13} color={colors.mutedForeground} />
            </Pressable>

            <Pressable
              onPress={() => {
                setPhase("searching");
                setDestination(null);
                clearRoute();
              }}
              style={[styles.locRow, { borderBottomColor: colors.border }]}
            >
              <View style={[styles.locDotDest, { backgroundColor: colors.destination }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.locLabel, { color: colors.mutedForeground }]}>
                  Destination
                </Text>
                <Text style={[styles.locValue, { color: colors.foreground }]} numberOfLines={1}>
                  {destination?.name ?? "—"}
                </Text>
              </View>
              <Feather name="edit-2" size={13} color={colors.mutedForeground} />
            </Pressable>

            {/* Distance / duration */}
            {routeLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
                  Calculating route…
                </Text>
              </View>
            ) : route ? (
              <View style={styles.metaRow}>
                <View style={[styles.metaBadge, { backgroundColor: colors.secondary }]}>
                  <Feather name="map" size={12} color={colors.primary} />
                  <Text style={[styles.metaText, { color: colors.primary }]}>
                    {route.distanceKm.toFixed(1)} km
                  </Text>
                </View>
                <View style={[styles.metaBadge, { backgroundColor: colors.secondary }]}>
                  <Feather name="clock" size={12} color={colors.primary} />
                  <Text style={[styles.metaText, { color: colors.primary }]}>
                    ~{route.durationMin} min
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Ride type selector */}
            <FlatList
              horizontal
              data={RIDE_OPTIONS}
              keyExtractor={(r) => r.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.rideRow}
              renderItem={({ item: r }) => {
                const active = selectedRide === r.id;
                const fare = route ? calcFare(route.distanceKm, r.id) : r.price;
                return (
                  <Pressable
                    onPress={() => {
                      setSelectedRide(r.id);
                      setOfferFare(calcFare(route?.distanceKm ?? 0, r.id));
                      Haptics.selectionAsync();
                    }}
                    style={[
                      styles.ridePill,
                      {
                        borderColor: active ? colors.primary : colors.border,
                        backgroundColor: active ? colors.primary : colors.card,
                      },
                    ]}
                  >
                    <RideTypeIcon
                      type={r.id}
                      size={20}
                      color={active ? colors.primaryForeground : colors.primary}
                    />
                    <Text
                      style={[
                        styles.ridePillName,
                        { color: active ? colors.primaryForeground : colors.foreground },
                      ]}
                    >
                      {r.name}
                    </Text>
                    <Text
                      style={[
                        styles.ridePillFare,
                        { color: active ? colors.primaryForeground : colors.mutedForeground },
                      ]}
                    >
                      {CURRENCY} {fare.toLocaleString()}
                    </Text>
                  </Pressable>
                );
              }}
            />

            {/* Fare adjuster */}
            <View style={[styles.fareRow, { borderColor: colors.border }]}>
              <Pressable
                onPress={() => {
                  setOfferFare((f) => Math.max(Math.round(baseFare * 0.75 / 100) * 100, f - 500));
                  Haptics.selectionAsync();
                }}
                style={[styles.fareBtn, { borderRightColor: colors.border }]}
              >
                <Feather name="minus" size={20} color={colors.foreground} />
              </Pressable>
              <View style={styles.fareCenter}>
                <Text style={[styles.fareValue, { color: colors.foreground }]}>
                  {CURRENCY} {offerFare > 0 ? offerFare.toLocaleString() : "—"}
                </Text>
                <Text style={[styles.fareHint, { color: colors.mutedForeground }]}>
                  {offerFare === baseFare ? "Recommended fare" : "Your offer to driver"}
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  setOfferFare((f) => f + 500);
                  Haptics.selectionAsync();
                }}
                style={[styles.fareBtn, { borderLeftColor: colors.border }]}
              >
                <Feather name="plus" size={20} color={colors.foreground} />
              </Pressable>
            </View>

            {/* Request Ride CTA */}
            <PressableScale
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                router.push({
                  pathname: "/driver-match",
                  params: {
                    fare: offerFare,
                    rideType: selectedRide,
                    distKm: route?.distanceKm.toFixed(1) ?? "0",
                    durationMin: route?.durationMin ?? 0,
                    destName: destination?.name ?? "",
                    pickupName: pickupLocation.name,
                    pickupLat: pickupLocation.lat,
                    pickupLng: pickupLocation.lng,
                  },
                });
              }}
              style={[styles.cta, { backgroundColor: colors.primary }]}
            >
              <MaterialCommunityIcons
                name="motorbike"
                size={20}
                color={colors.primaryForeground}
                style={{ marginRight: 8 }}
              />
              <Text style={[styles.ctaText, { color: colors.primaryForeground }]}>
                Request Ride
              </Text>
            </PressableScale>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  mapFill: { ...StyleSheet.absoluteFillObject },

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
    shadowOpacity: 0.1,
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
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },

  whereToPill: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    zIndex: 10,
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 6,
  },
  whereToIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  whereToText: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },
  whereToArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
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
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 10,
    elevation: 5,
    zIndex: 10,
  },
  locateDotRing: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#1a73e8",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
  },
  locateDotInner: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#1a73e8",
  },
  crossH: {
    position: "absolute",
    width: 28,
    height: 1.5,
    borderRadius: 1,
    opacity: 0.4,
  },
  crossV: {
    position: "absolute",
    width: 1.5,
    height: 28,
    borderRadius: 1,
    opacity: 0.4,
  },

  idleSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingTop: 10,
    paddingBottom: 18,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 16,
    elevation: 10,
    zIndex: 10,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 10,
  },
  ridersBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 18,
    marginBottom: 6,
  },
  ridersText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  ridersDot: { fontSize: 12 },
  ridersTextSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  idleTitle: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    paddingHorizontal: 18,
    marginBottom: 8,
  },
  quickRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 2 },
  quickChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: 160,
  },
  quickText: { fontSize: 12, fontFamily: "Inter_500Medium", flexShrink: 1 },

  searchOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  searchHeader: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  searchDot: { width: 10, height: 10, borderRadius: 5 },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    padding: 0,
  },

  fromRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  fromDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  fromDotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" },
  fromLabel: { fontSize: 10, fontFamily: "Inter_500Medium" },
  fromValue: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  suggestionList: { paddingBottom: 40 },
  sugItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sugIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sugName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  sugSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },

  routeSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 18,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 18,
    elevation: 14,
    zIndex: 10,
  },
  locRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  locDotPickup: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  locDotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" },
  locDotDest: { width: 14, height: 14, borderRadius: 7, marginHorizontal: 4 },
  locLabel: { fontSize: 10, fontFamily: "Inter_500Medium" },
  locValue: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  loadingRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8 },
  loadingText: { fontSize: 13, fontFamily: "Inter_400Regular" },

  metaRow: { flexDirection: "row", gap: 8, paddingVertical: 8 },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  metaText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },

  rideRow: { gap: 8, paddingVertical: 4, paddingRight: 8 },
  ridePill: {
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 3,
    minWidth: 80,
  },
  ridePillName: { fontSize: 11, fontFamily: "Inter_700Bold" },
  ridePillFare: { fontSize: 10, fontFamily: "Inter_500Medium" },

  fareRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    marginTop: 8,
    overflow: "hidden",
  },
  fareBtn: {
    width: 52,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  fareCenter: { flex: 1, alignItems: "center" },
  fareValue: { fontSize: 16, fontFamily: "Inter_700Bold" },
  fareHint: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 2 },

  cta: {
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: { fontSize: 15, fontFamily: "Inter_700Bold", letterSpacing: 0.2 },
});
