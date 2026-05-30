import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { StickerSquare } from "../components/StickerSquare";
import { TeamAccordion } from "../components/TeamAccordion";
import { AlbumSticker } from "../hooks/useAlbumApp";
import { EmptyState } from "./EmptyState";
import { colors, radius, spacing, type } from "../theme/tokens";
import { getCollectionStats, isStickerOwned } from "../utils/collectionLists";

type AlbumSortMode = "progress" | "name" | "code";

export function AlbumScreen({
  album,
  toggleSticker,
  addDuplicate,
}: {
  album: AlbumSticker[];
  toggleSticker: (code: string) => Promise<void>;
  addDuplicate: (code: string) => Promise<void>;
}) {
  const [sortMode, setSortMode] = useState<AlbumSortMode>("progress");
  const stats = useMemo(() => getCollectionStats(album), [album]);

  const grouped = useMemo(() => {
    const byTeam = new Map<string, AlbumSticker[]>();
    for (const sticker of album) {
      const bucket = byTeam.get(sticker.team) ?? [];
      bucket.push(sticker);
      byTeam.set(sticker.team, bucket);
    }

    const stickerSorter =
      sortMode === "name"
        ? (left: AlbumSticker, right: AlbumSticker) =>
            left.playerName.localeCompare(right.playerName) ||
            left.code.localeCompare(right.code)
        : (left: AlbumSticker, right: AlbumSticker) =>
            left.code.localeCompare(right.code) ||
            left.playerName.localeCompare(right.playerName);

    return [...byTeam.entries()]
      .map(([teamName, stickers]) => [
        teamName,
        [...stickers].sort(stickerSorter),
      ] as const)
      .sort((left, right) => {
        if (sortMode === "progress") {
          const leftOwned = left[1].filter(isStickerOwned).length;
          const rightOwned = right[1].filter(isStickerOwned).length;
          return rightOwned - leftOwned || left[0].localeCompare(right[0]);
        }

        if (sortMode === "code") {
          const leftCode = left[1][0]?.code ?? "";
          const rightCode = right[1][0]?.code ?? "";
          return leftCode.localeCompare(rightCode) || left[0].localeCompare(right[0]);
        }

        return left[0].localeCompare(right[0]);
      });
  }, [album, sortMode]);

  return (
    <View>
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <View>
            <Text style={styles.progressEyebrow}>Progresso do álbum</Text>
            <Text style={styles.progressTitle}>
              {stats.completionPercentage}% completo
            </Text>
          </View>
          <Text style={styles.progressCount}>
            {stats.ownedCount}/{stats.total}
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${stats.completionPercentage}%` },
            ]}
          />
        </View>
        <View style={styles.statsRow}>
          <Text style={styles.statText}>{stats.missingCount} faltando</Text>
          <Text style={styles.statText}>
            {stats.duplicateCopiesCount} repetidas
          </Text>
        </View>
      </View>

      <View style={styles.filtersCard}>
        <Text style={styles.filtersTitle}>Ordenar álbum</Text>
        <View style={styles.sortRow}>
          {[
            { id: "progress", label: "Mais completas" },
            { id: "name", label: "País A-Z" },
            { id: "code", label: "Código" },
          ].map((option) => {
            const selected = sortMode === option.id;
            return (
              <Pressable
                key={option.id}
                accessibilityRole="button"
                accessibilityLabel={`ordenar por ${option.label}`}
                accessibilityState={{ selected }}
                style={[styles.sortButton, selected && styles.sortButtonActive]}
                onPress={() => setSortMode(option.id as AlbumSortMode)}
              >
                <Text
                  style={[
                    styles.sortButtonText,
                    selected && styles.sortButtonTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {grouped.length === 0 ? (
        <EmptyState
          title="Nenhuma figurinha carregada"
          description="Atualize o álbum para carregar o catálogo."
        />
      ) : null}

      {grouped.map(([teamName, stickers]) => (
        <TeamAccordion
          key={teamName}
          teamName={teamName}
          teamCode={stickers[0]?.code.match(/^[A-Z]{3}/)?.[0] ?? ""}
          badge={`${stickers.filter(isStickerOwned).length}/${stickers.length}`}
          defaultExpanded={teamName === "Brasil"}
          renderContent={() =>
            stickers.map((sticker) => (
              <StickerSquare
                key={sticker.code}
                sticker={sticker}
                state={sticker}
                onToggle={() => toggleSticker(sticker.code)}
                onDuplicate={() => addDuplicate(sticker.code)}
              />
            ))
          }
        >
          {null}
        </TeamAccordion>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  progressCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  progressEyebrow: {
    ...type.eyebrow,
    color: colors.textMuted,
    textTransform: "uppercase",
  },
  progressTitle: {
    ...type.title,
    fontSize: 24,
    color: colors.text,
    marginTop: 2,
  },
  progressCount: {
    ...type.code,
    color: colors.primaryStrong,
  },
  progressTrack: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.backgroundAlt,
    overflow: "hidden",
    marginTop: spacing.md,
  },
  progressFill: {
    height: "100%",
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  statText: {
    ...type.caption,
    color: colors.textMuted,
  },
  filtersCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  filtersTitle: {
    ...type.section,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  sortRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  sortButton: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  sortButtonActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentStrong,
  },
  sortButtonText: {
    ...type.label,
    color: colors.textMuted,
  },
  sortButtonTextActive: {
    color: colors.primaryStrong,
  },
});
