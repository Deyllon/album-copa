import React from "react";
import { Pressable } from "react-native";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { CatalogSticker } from "@copa/shared";
import { StickerLine } from "../components/StickerLine";
import { AlbumSticker } from "../hooks/useAlbumApp";
import { colors, radius, spacing, type } from "../theme/tokens";
import { EmptyState } from "./EmptyState";

export function SearchScreen({
  query,
  setQuery,
  searchResults,
  album,
  toggleSticker,
  addDuplicate,
}: {
  query: string;
  setQuery: (q: string) => void;
  searchResults: CatalogSticker[];
  album: AlbumSticker[];
  toggleSticker: (code: string) => Promise<void>;
  addDuplicate: (code: string) => Promise<void>;
}) {
  const normalizedQuery = query.trim();
  const quickSearches = ["BRA2", "Brasil", "Messi"];

  return (
    <View>
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Encontre uma figurinha</Text>
        <Text style={styles.helper}>
          Busque por código, nome do jogador ou seleção.
        </Text>
        <TextInput
          accessibilityRole="search"
          accessibilityLabel="pesquisar figurinha"
          style={styles.input}
          placeholder="Ex.: BRA2 ou Alisson"
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
        />
        <View style={styles.quickRow}>
          {quickSearches.map((item) => (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityLabel={`busca rapida ${item}`}
              style={styles.quickChip}
              onPress={() => setQuery(item)}
            >
              <Text style={styles.quickChipText}>{item}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {normalizedQuery.length === 0 ? (
        <EmptyState
          title="Faça uma busca"
          description="Digite um código, um jogador ou uma seleção para encontrar a figurinha certa."
        />
      ) : null}

      {normalizedQuery.length > 0 ? (
        <Text style={styles.resultSummary}>
          {searchResults.length === 0
            ? "Nenhum resultado encontrado"
            : `${searchResults.length} figurinha${searchResults.length > 1 ? "s" : ""} encontrada${searchResults.length > 1 ? "s" : ""}`}
        </Text>
      ) : null}

      {searchResults.length === 0 && normalizedQuery.length > 0 ? (
        <EmptyState
          title="Nenhuma figurinha encontrada"
          description="Tente buscar pelo código da figurinha ou pelo nome do jogador."
        />
      ) : null}

      {searchResults.map((sticker) => (
        <StickerLine
          key={sticker.code}
          sticker={sticker}
          state={
            album.find((albumSticker) => albumSticker.code === sticker.code) ??
            {
              code: sticker.code,
              owned: false,
              duplicateCount: 0,
            }
          }
          onToggle={() => toggleSticker(sticker.code)}
          onDuplicate={() => addDuplicate(sticker.code)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  heroTitle: {
    ...type.section,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  helper: {
    ...type.body,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  input: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: 14,
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  resultSummary: {
    ...type.label,
    color: colors.primaryStrong,
    marginBottom: spacing.sm,
  },
  quickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  quickChip: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  quickChipText: {
    ...type.caption,
    color: colors.primaryStrong,
  },
});
