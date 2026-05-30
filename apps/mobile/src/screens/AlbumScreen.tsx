import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { normalizeText } from "@copa/shared";
import { StickerSquare } from "../components/StickerSquare";
import { TeamAccordion } from "../components/TeamAccordion";
import { AlbumSticker } from "../hooks/useAlbumApp";
import { EmptyState } from "./EmptyState";
import { colors, radius, spacing, type } from "../theme/tokens";

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
  const [filterQuery, setFilterQuery] = useState("");
  const [sortMode, setSortMode] = useState<AlbumSortMode>("progress");

  const filteredAlbum = useMemo(() => {
    const normalizedFilter = normalizeText(filterQuery);
    if (!normalizedFilter) {
      return album;
    }

    return album.filter((sticker) => {
      const candidates = [
        sticker.team,
        sticker.code,
        sticker.playerName,
        ...sticker.aliases,
      ];

      return candidates.some((candidate) =>
        normalizeText(candidate).includes(normalizedFilter),
      );
    });
  }, [album, filterQuery]);

  const grouped = useMemo(() => {
    const byTeam = new Map<string, AlbumSticker[]>();
    for (const sticker of filteredAlbum) {
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
          const leftOwned = left[1].filter((item) => item.owned).length;
          const rightOwned = right[1].filter((item) => item.owned).length;
          return rightOwned - leftOwned || left[0].localeCompare(right[0]);
        }

        if (sortMode === "code") {
          const leftCode = left[1][0]?.code ?? "";
          const rightCode = right[1][0]?.code ?? "";
          return leftCode.localeCompare(rightCode) || left[0].localeCompare(right[0]);
        }

        return left[0].localeCompare(right[0]);
      });
  }, [filteredAlbum, sortMode]);

  return (
    <View>
      <View style={styles.filtersCard}>
        <Text style={styles.filtersTitle}>Organizar álbum</Text>
        <TextInput
          accessibilityLabel="filtrar album"
          placeholder="Filtre por país, nome ou código"
          placeholderTextColor={colors.textMuted}
          style={styles.filterInput}
          value={filterQuery}
          onChangeText={setFilterQuery}
          autoCapitalize="characters"
          autoCorrect={false}
        />
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
          title="Nenhuma figurinha encontrada"
          description="Tente outro nome, código ou país para filtrar o álbum."
        />
      ) : null}

      {grouped.map(([teamName, stickers]) => (
        <TeamAccordion
          key={teamName}
          teamName={teamName}
          teamCode={stickers[0]?.code.match(/^[A-Z]{3}/)?.[0] ?? ""}
          badge={`${stickers.filter((sticker) => sticker.owned).length}/${stickers.length}`}
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
  filterInput: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    color: colors.text,
    ...type.bodyStrong,
  },
  sortRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
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
