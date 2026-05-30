import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, type } from "../theme/tokens";

export function TeamAccordion({
  teamName,
  teamCode,
  badge,
  defaultExpanded = false,
  renderContent,
  children,
}: {
  teamName: string;
  teamCode?: string;
  badge?: string;
  defaultExpanded?: boolean;
  renderContent?: () => React.ReactNode;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`selecao ${teamName}`}
        accessibilityState={{ expanded }}
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
      >
        <View style={styles.headerMain}>
          <View>
            <Text style={styles.teamName}>{teamName}</Text>
            {teamCode ? <Text style={styles.teamCode}>{teamCode}</Text> : null}
          </View>
          {badge ? <Text style={styles.badge}>{badge}</Text> : null}
        </View>
        <Text style={styles.icon}>{expanded ? "^" : "v"}</Text>
      </Pressable>

      {expanded ? <View style={styles.content}>{renderContent ? renderContent() : children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    padding: spacing.md,
    backgroundColor: colors.backgroundAlt,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  teamName: {
    ...type.bodyStrong,
    color: colors.text,
  },
  teamCode: {
    ...type.eyebrow,
    color: colors.textMuted,
    marginTop: 2,
  },
  badge: {
    backgroundColor: colors.accentSoft,
    color: colors.primaryStrong,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    ...type.eyebrow,
  },
  icon: {
    ...type.caption,
    color: colors.textMuted,
  },
  content: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 8,
    gap: 8,
    backgroundColor: colors.surface,
  },
});
