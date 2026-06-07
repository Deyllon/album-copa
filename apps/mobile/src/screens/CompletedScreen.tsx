import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AlbumSticker } from "../hooks/useAlbumApp";
import { colors, radius, spacing, type } from "../theme/tokens";
import { getCompletedTeamGroups } from "../utils/collectionLists";
import { EmptyState } from "./EmptyState";

export function CompletedScreen({ album }: { album: AlbumSticker[] }) {
  const completedGroups = useMemo(() => getCompletedTeamGroups(album), [album]);

  if (completedGroups.length === 0) {
    return (
      <EmptyState
        title="Nenhuma seleção completa"
        description="Quando você completar uma seleção, ela aparecerá aqui."
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.screenHeader}>
        <Text accessibilityRole="header" style={styles.title}>
          Seleções completas
        </Text>
        <Text style={styles.subtitle}>
          Veja as seleções em que você já conseguiu todas as figurinhas.
        </Text>
      </View>

      {completedGroups.map(([teamCode, stickers]) => (
        <View
          key={teamCode}
          accessible
          accessibilityLabel={`${stickers[0]?.team ?? teamCode}, seleção completa, ${stickers.length} de ${stickers.length}`}
          style={styles.teamCard}
        >
          <View style={styles.teamCodePill}>
            <Text style={styles.teamCode}>{teamCode}</Text>
          </View>
          <View style={styles.teamInfo}>
            <Text style={styles.teamName}>{stickers[0]?.team ?? teamCode}</Text>
            <Text style={styles.teamMeta}>Seleção completa</Text>
          </View>
          <Text style={styles.count}>
            {stickers.length}/{stickers.length}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  screenHeader: {
    marginBottom: spacing.xs,
  },
  title: {
    ...type.title,
    fontSize: 22,
    color: colors.text,
  },
  subtitle: {
    ...type.body,
    color: colors.textMuted,
    marginTop: 4,
  },
  teamCard: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  teamCodePill: {
    minWidth: 64,
    minHeight: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  teamCode: {
    ...type.code,
    color: colors.primaryStrong,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    ...type.bodyStrong,
    color: colors.text,
  },
  teamMeta: {
    ...type.caption,
    color: colors.textMuted,
    marginTop: 1,
  },
  count: {
    ...type.code,
    color: colors.primaryStrong,
  },
});
