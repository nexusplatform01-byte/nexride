import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PressableScale } from "@/components/PressableScale";
import { PAYMENT_METHODS } from "@/constants/data";
import { CURRENCY } from "@/constants/rides";
import { useColors } from "@/hooks/useColors";

export default function WalletScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingTop: topInset + 12, paddingBottom: 120 }}>
        <Text style={[styles.title, { color: colors.foreground }]}>Wallet</Text>

        <View style={[styles.balanceCard, { backgroundColor: colors.primary }]}>
          <Text style={[styles.balanceLabel, { color: colors.primaryForeground, opacity: 0.75 }]}>
            Available balance
          </Text>
          <Text style={[styles.balanceValue, { color: colors.primaryForeground }]}>
            {CURRENCY} 84,500
          </Text>

          <View style={styles.balanceActions}>
            <PressableScale
              style={[styles.balanceBtn, { backgroundColor: "rgba(255,255,255,0.18)" }]}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            >
              <Feather name="plus" size={16} color={colors.primaryForeground} />
              <Text style={[styles.balanceBtnText, { color: colors.primaryForeground }]}>
                Top up
              </Text>
            </PressableScale>
            <PressableScale
              style={[styles.balanceBtn, { backgroundColor: "rgba(255,255,255,0.18)" }]}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            >
              <Feather name="arrow-up-right" size={16} color={colors.primaryForeground} />
              <Text style={[styles.balanceBtnText, { color: colors.primaryForeground }]}>
                Send
              </Text>
            </PressableScale>
          </View>
        </View>

        <Text style={[styles.section, { color: colors.foreground }]}>Payment methods</Text>
        <View style={{ gap: 10 }}>
          {PAYMENT_METHODS.map((p) => (
            <Pressable
              key={p.id}
              style={[styles.methodRow, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => Haptics.selectionAsync()}
            >
              <View style={[styles.methodIcon, { backgroundColor: colors.secondary }]}>
                <MaterialCommunityIcons
                  name={
                    p.type === "cash"
                      ? "cash-multiple"
                      : p.type === "wallet"
                      ? "wallet"
                      : "cellphone"
                  }
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.methodLabel, { color: colors.foreground }]}>{p.label}</Text>
                <Text style={[styles.methodDetail, { color: colors.mutedForeground }]}>
                  {p.detail}
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </Pressable>
          ))}
        </View>

        <Text style={[styles.section, { color: colors.foreground }]}>Recent transactions</Text>
        <View style={[styles.txCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {[
            { label: "Ride to Emaar Square", amount: -23 },
            { label: "Top up via MTN", amount: 50000 },
            { label: "Ride to Gulu Market", amount: -8 },
          ].map((t, i, arr) => (
            <View
              key={i}
              style={[
                styles.txRow,
                i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}
            >
              <View style={styles.row}>
                <View
                  style={[
                    styles.txIcon,
                    {
                      backgroundColor:
                        t.amount > 0 ? "rgba(31,181,122,0.12)" : colors.secondary,
                    },
                  ]}
                >
                  <Feather
                    name={t.amount > 0 ? "arrow-down-left" : "arrow-up-right"}
                    size={14}
                    color={t.amount > 0 ? colors.success : colors.primary}
                  />
                </View>
                <Text style={[styles.txLabel, { color: colors.foreground }]}>{t.label}</Text>
              </View>
              <Text
                style={[
                  styles.txAmount,
                  { color: t.amount > 0 ? colors.success : colors.foreground },
                ]}
              >
                {t.amount > 0 ? "+" : ""}
                {CURRENCY} {Math.abs(t.amount).toLocaleString()}
              </Text>
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
  balanceCard: { marginTop: 18, padding: 20, borderRadius: 20 },
  balanceLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  balanceValue: { fontSize: 30, fontFamily: "Inter_700Bold", marginTop: 8 },
  balanceActions: { flexDirection: "row", gap: 10, marginTop: 18 },
  balanceBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  balanceBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  section: { fontSize: 14, fontFamily: "Inter_700Bold", marginTop: 24, marginBottom: 12 },
  methodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  methodIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  methodLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  methodDetail: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  txCard: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 14 },
  txRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  txIcon: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  txLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  txAmount: { fontSize: 13, fontFamily: "Inter_700Bold" },
});
