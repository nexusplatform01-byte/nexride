import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const ITEMS: Array<{ icon: keyof typeof Feather.glyphMap; label: string }> = [
  { icon: "user", label: "Personal information" },
  { icon: "shield", label: "Safety preferences" },
  { icon: "map-pin", label: "Saved places" },
  { icon: "gift", label: "Promotions" },
  { icon: "bell", label: "Notifications" },
  { icon: "help-circle", label: "Help & support" },
  { icon: "settings", label: "Settings" },
];

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingTop: topInset + 12, paddingBottom: 120 }}>
        <View style={[styles.header, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>AO</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: colors.foreground }]}>Apio Okello</Text>
            <Text style={[styles.phone, { color: colors.mutedForeground }]}>+256 700 123 456</Text>
            <View style={styles.ratingRow}>
              <Feather name="star" size={13} color={colors.warning} />
              <Text style={[styles.rating, { color: colors.foreground }]}>4.92</Text>
              <Text style={[styles.ratingMeta, { color: colors.mutedForeground }]}>
                · 124 trips
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.list, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {ITEMS.map((item, i) => (
            <Pressable
              key={item.label}
              onPress={() => Haptics.selectionAsync()}
              style={[
                styles.itemRow,
                i < ITEMS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}
            >
              <View style={styles.row}>
                <View style={[styles.itemIcon, { backgroundColor: colors.secondary }]}>
                  <Feather name={item.icon} size={16} color={colors.primary} />
                </View>
                <Text style={[styles.itemLabel, { color: colors.foreground }]}>{item.label}</Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </Pressable>
          ))}
        </View>

        <Pressable
          style={[styles.logout, { borderColor: colors.border }]}
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
        >
          <Feather name="log-out" size={16} color={colors.destructive} />
          <Text style={[styles.logoutText, { color: colors.destructive }]}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
  },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 18, fontFamily: "Inter_700Bold" },
  name: { fontSize: 17, fontFamily: "Inter_700Bold" },
  phone: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 2 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  rating: { fontSize: 12, fontFamily: "Inter_700Bold" },
  ratingMeta: { fontSize: 12, fontFamily: "Inter_500Medium" },
  list: { marginTop: 20, borderRadius: 16, borderWidth: 1, paddingHorizontal: 14 },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  itemIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  itemLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  logout: {
    marginTop: 24,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  logoutText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
