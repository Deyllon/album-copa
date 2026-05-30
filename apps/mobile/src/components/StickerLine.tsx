import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { CatalogSticker, UserStickerState } from "@copa/shared";
import { colors, radius, spacing, type } from "../theme/tokens";

export function StickerLine({
  sticker,
  state,
  onToggle,
  onDuplicate,
  selected,
  onSelect,
}: {
  sticker: CatalogSticker;
  state: UserStickerState;
  onToggle: () => void;
  onDuplicate: () => void;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const playerName = sticker.playerName || "Escudo/Brilhante";

  return (
    <View
      style={[styles.container, state.owned ? styles.owned : styles.missing]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: !!selected }}
        accessibilityLabel={`alternar ${sticker.code}`}
        style={[styles.mainAction, selected && styles.selectedTransform]}
        onPress={onSelect ? onSelect : onToggle}
      >
        <Text style={styles.code}>{sticker.code}</Text>
        <Text style={styles.name}>{playerName}</Text>
        <Text style={styles.meta}>{sticker.team}</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Adicionar repetida. Atual: ${state.duplicateCount}`}
        style={[
          styles.duplicateBadge,
          state.duplicateCount > 0 && styles.duplicateBadgeActive,
          state.duplicateCount === 0 && styles.duplicateBadgeEmpty,
        ]}
        onPress={onDuplicate}
      >
        <Text
          style={[
            styles.duplicateText,
            state.duplicateCount > 0 && styles.duplicateTextActive,
          ]}
        >
          {state.duplicateCount}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  owned: {
    backgroundColor: colors.surface,
    borderColor: colors.primaryStrong,
  },
  missing: {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
  },
  mainAction: {
    flex: 1,
  },
  code: {
    ...type.code,
    color: colors.primaryStrong,
    marginBottom: 2,
  },
  name: {
    ...type.bodyStrong,
    color: colors.text,
  },
  meta: {
    ...type.caption,
    color: colors.textMuted,
  },
  duplicateBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.md,
  },
  duplicateBadgeEmpty: {
    opacity: 0.45,
  },
  duplicateBadgeActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accentStrong,
  },
  duplicateText: {
    ...type.bodyStrong,
    color: colors.textMuted,
  },
  duplicateTextActive: {
    color: colors.primaryStrong,
  },
  selectedTransform: {
    transform: [{ translateY: -6 }],
    borderColor: colors.primaryStrong,
    shadowColor: colors.primaryStrong,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
});
