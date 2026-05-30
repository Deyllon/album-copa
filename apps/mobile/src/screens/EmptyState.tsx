import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, type } from "../theme/tokens";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.marker} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  marker: {
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    marginBottom: spacing.md,
  },
  title: {
    ...type.section,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  description: {
    ...type.body,
    color: colors.textMuted,
  },
});
