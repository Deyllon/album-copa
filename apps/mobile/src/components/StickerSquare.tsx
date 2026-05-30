import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { CatalogSticker, UserStickerState } from "@copa/shared";
import { colors, radius, spacing, type } from "../theme/tokens";

export function StickerSquare({
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
  const playerName = sticker.playerName || "Escudo/Especial";

  return (
    <View
      style={[
        styles.square,
        state.owned ? styles.ownedSquare : styles.missingSquare,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: !!selected }}
        accessibilityLabel={`alternar ${sticker.code}`}
        style={[styles.mainContent, selected && styles.selectedTransform]}
        onPress={onSelect ? onSelect : onToggle}
      >
        <Text
          style={[
            styles.code,
            state.owned ? styles.ownedText : styles.missingText,
          ]}
        >
          {sticker.code}
        </Text>
        <Text style={styles.name} numberOfLines={2} ellipsizeMode="tail">
          {playerName}
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Adicionar repetida. Atual: ${state.duplicateCount}`}
        hitSlop={10}
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
  square: {
    width: "31.5%",
    height: 110,
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: "hidden",
    flexDirection: "column",
    marginBottom: spacing.xs,
    position: "relative",
  },
  ownedSquare: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  missingSquare: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  mainContent: {
    flex: 1,
    padding: spacing.sm,
    justifyContent: "center",
  },
  code: {
    ...type.code,
    marginBottom: 4,
  },
  ownedText: {
    color: colors.primaryStrong,
  },
  missingText: {
    color: colors.textMuted,
  },
  name: {
    ...type.bodyStrong,
    color: colors.text,
    fontSize: 12,
  },
  duplicateBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  duplicateBadgeEmpty: {
    opacity: 0.45,
  },
  duplicateBadgeActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accentStrong,
  },
  duplicateText: {
    ...type.caption,
    color: colors.textMuted,
    fontWeight: "bold",
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
