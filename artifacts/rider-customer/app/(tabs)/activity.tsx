import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TRIPS } from "@/constants/data";
import { CURRENCY } from "@/constants/rides";
import { useColors } from "@/hooks/useColors";

export default function ActivityScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingTop: topInset + 12, paddingBottom: 120 }}>
        <Text style={[styles.title, { color: colors.foreground }]}>Activity</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Your past rides and deliveries
        </Text>

        <View style={{ gap: 10, marginTop: 18 }}>
          {TRIPS.map((t) => (
            <View
              key={t.id}
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.date, { color: colors.mutedForeground }]}>{t.date}</Text>
                <Text
                  style={[
                    styles.status,
                    {
                      color: t.status === "completed" ? colors.success : colors.destructive,
                    },
                  ]}
                >
                  {t.status === "completed" ? "Completed" : "Cancelled"}
                </Text>
              </View>

              <View style={styles.routeRow}>
                <View style={styles.routeIcons}>
                  <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                  <View style={[styles.line, { backgroundColor: colors.border }]} />
                  <View style={[styles.square, { backgroundColor: colors.destination }]} />
                </View>
                <View style={{ flex: 1, gap: 14 }}>
                  <Text style={[styles.place, { color: colors.foreground }]}>{t.pickup}</Text>
                  <Text style={[styles.place, { color: colors.foreground }]}>
                    {t.destination}
                  </Text>
                </View>
              </View>

              <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                <View style={styles.row}>
                  <Feather name="navigation" size={13} color={colors.mutedForeground} />
                  <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
                    {t.ride}
                  </Text>
                </View>
                <Text style={[styles.price, { color: colors.foreground }]}>
                  {CURRENCY} {t.price}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 4 },
  card: { borderRadius: 16, padding: 14, borderWidth: 1 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between" },
  date: { fontSize: 12, fontFamily: "Inter_500Medium" },
  status: { fontSize: 12, fontFamily: "Inter_700Bold" },
  routeRow: { flexDirection: "row", gap: 12, marginTop: 12 },
  routeIcons: { alignItems: "center", paddingTop: 4 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  line: { width: 2, flex: 1, marginVertical: 4 },
  square: { width: 10, height: 10, borderRadius: 2 },
  place: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  footerText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  price: { fontSize: 14, fontFamily: "Inter_700Bold" },
});
