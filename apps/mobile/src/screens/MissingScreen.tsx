import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AlbumSticker } from "../hooks/useAlbumApp";
import { colors, radius, spacing, type } from "../theme/tokens";
import {
  getMissingStickers,
  getStickerName,
  groupStickersByTeamCode,
} from "../utils/collectionLists";
import { EmptyState } from "./EmptyState";

export function MissingScreen({
  album,
  toggleSticker,
}: {
  album: AlbumSticker[];
  toggleSticker: (code: string) => Promise<void>;
}) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const missingGroups = useMemo(
    () => groupStickersByTeamCode(getMissingStickers(album)),
    [album],
  );

  function toggleGroup(teamCode: string) {
    setExpandedGroups((current) => {
      const next = new Set(current);
      next.has(teamCode) ? next.delete(teamCode) : next.add(teamCode);
      return next;
    });
  }

  if (missingGroups.length === 0) {
    return (
      <EmptyState
        title="Álbum completo"
        description="Todas as figurinhas do catálogo já estão marcadas no seu álbum."
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.screenHeader}>
        <Text style={styles.title}>Faltantes</Text>
        <Text style={styles.subtitle}>
          Toque no código da seleção para abrir as figurinhas que faltam.
        </Text>
      </View>

      {missingGroups.map(([teamCode, stickers]) => {
        const expanded = expandedGroups.has(teamCode);

        return (
          <View key={teamCode} style={styles.groupCard}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`abrir faltantes ${teamCode}`}
              accessibilityState={{ expanded }}
              style={styles.groupHeader}
              onPress={() => toggleGroup(teamCode)}
            >
              <View style={styles.teamCodePill}>
                <Text style={styles.teamCode}>{teamCode}</Text>
              </View>
              <View style={styles.groupInfo}>
                <Text style={styles.groupTitle}>{stickers[0]?.team ?? teamCode}</Text>
                <Text style={styles.groupMeta}>{stickers.length} faltando</Text>
              </View>
              <Ionicons
                name={expanded ? "chevron-up" : "chevron-down"}
                size={20}
                color={colors.textMuted}
              />
            </Pressable>

            {expanded ? (
              <View style={styles.drawer}>
                {stickers.map((sticker) => (
                  <Pressable
                    key={sticker.code}
                    accessibilityRole="button"
                    accessibilityLabel={`adicionar ${sticker.code} ao álbum`}
                    style={styles.stickerRow}
                    onPress={() => toggleSticker(sticker.code)}
                  >
                    <View style={styles.stickerMain}>
                      <Text style={styles.stickerCode}>{sticker.code}</Text>
                      <Text style={styles.stickerName}>{getStickerName(sticker)}</Text>
                      <Text style={styles.stickerMeta}>
                        Página {sticker.albumPage} | Posição {sticker.albumPosition}
                      </Text>
                    </View>
                    <Ionicons
                      name="add-circle-outline"
                      size={22}
                      color={colors.primaryStrong}
                    />
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        );
      })}
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
  groupCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.backgroundAlt,
  },
  teamCodePill: {
    minWidth: 64,
    minHeight: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  teamCode: {
    ...type.code,
    color: colors.primaryStrong,
  },
  groupInfo: {
    flex: 1,
  },
  groupTitle: {
    ...type.bodyStrong,
    color: colors.text,
  },
  groupMeta: {
    ...type.caption,
    color: colors.textMuted,
    marginTop: 1,
  },
  drawer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.backgroundAlt,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  stickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  stickerMain: {
    flex: 1,
  },
  stickerCode: {
    ...type.code,
    color: colors.primaryStrong,
  },
  stickerName: {
    ...type.bodyStrong,
    color: colors.text,
    marginTop: 2,
  },
  stickerMeta: {
    ...type.caption,
    color: colors.textMuted,
    marginTop: 1,
  },
});
