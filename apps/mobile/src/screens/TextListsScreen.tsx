import React, { useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AlbumSticker } from "../hooks/useAlbumApp";
import { colors, radius, spacing, type } from "../theme/tokens";
import {
  buildShareText,
  compareFriendTextToMissing,
  getDuplicateStickers,
  getMissingStickers,
  getStickerName,
} from "../utils/collectionLists";
import { EmptyState } from "./EmptyState";

export function TextListsScreen({
  album,
  toggleSticker,
}: {
  album: AlbumSticker[];
  toggleSticker: (code: string) => Promise<void>;
}) {
  const [friendText, setFriendText] = useState("");
  const duplicates = useMemo(() => getDuplicateStickers(album), [album]);
  const missing = useMemo(() => getMissingStickers(album), [album]);
  const textComparison = useMemo(
    () => compareFriendTextToMissing(friendText, album),
    [album, friendText],
  );

  async function shareList(title: string, stickers: AlbumSticker[], includeDuplicates: boolean) {
    const message = buildShareText({ title, stickers, includeDuplicates });
    try {
      await Share.share({ title, message });
    } catch {
      const fallback = "Não consegui abrir o compartilhamento agora.";
      if (Platform.OS === "android") {
        ToastAndroid.show(fallback, ToastAndroid.SHORT);
      } else {
        Alert.alert("Compartilhamento", fallback);
      }
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.screenHeader}>
        <Text style={styles.title}>Listas e texto</Text>
        <Text style={styles.subtitle}>
          Exporte suas listas ou cole a lista de um amigo para comparar.
        </Text>
      </View>

      <View style={styles.exportCard}>
        <Text style={styles.sectionTitle}>Exportar para troca</Text>
        <View style={styles.exportActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="exportar repetidas"
            style={styles.primaryAction}
            onPress={() => shareList("Minhas repetidas", duplicates, true)}
          >
            <Ionicons name="share-social-outline" size={19} color={colors.primaryStrong} />
            <Text style={styles.primaryActionText}>Repetidas</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="exportar faltantes"
            style={styles.primaryAction}
            onPress={() => shareList("Figurinhas que faltam", missing, false)}
          >
            <Ionicons name="share-social-outline" size={19} color={colors.primaryStrong} />
            <Text style={styles.primaryActionText}>Faltantes</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.compareCard}>
        <Text style={styles.sectionTitle}>Comparar texto do amigo</Text>
        <Text style={styles.sectionSubtitle}>
          Cole a lista recebida no WhatsApp. O app mostra só o que falta para você.
        </Text>
        <TextInput
          accessibilityLabel="texto de repetidas do amigo"
          multiline
          textAlignVertical="top"
          placeholder="Cole aqui a lista enviada no WhatsApp"
          placeholderTextColor={colors.textMuted}
          style={styles.textArea}
          value={friendText}
          onChangeText={setFriendText}
          autoCorrect={false}
        />

        {friendText.trim() ? (
          <View style={styles.comparisonSummary}>
            <Text style={styles.statText}>
              Faltam para você: {textComparison.needed.length}
            </Text>
            <Text style={styles.statText}>
              Você já tem: {textComparison.alreadyOwned.length}
            </Text>
            <Text style={styles.statText}>
              Não reconhecidas: {textComparison.unmatchedLines.length}
            </Text>
          </View>
        ) : null}

        {textComparison.needed.length > 0 ? (
          <View style={styles.resultList}>
            {textComparison.needed.map((sticker) => (
              <Pressable
                key={sticker.code}
                accessibilityRole="button"
                accessibilityLabel={`adicionar ${sticker.code} da comparação`}
                style={styles.stickerRow}
                onPress={() => toggleSticker(sticker.code)}
              >
                <View style={styles.stickerMain}>
                  <Text style={styles.stickerCode}>{sticker.code}</Text>
                  <Text style={styles.stickerName}>{getStickerName(sticker)}</Text>
                  <Text style={styles.stickerMeta}>
                    {sticker.team} | Página {sticker.albumPage} | Posição {sticker.albumPosition}
                  </Text>
                </View>
                <Ionicons name="add-circle-outline" size={22} color={colors.primaryStrong} />
              </Pressable>
            ))}
          </View>
        ) : null}

        {textComparison.unmatchedLines.length > 0 ? (
          <View style={styles.unmatchedCard}>
            <Text accessibilityRole="header" style={styles.unmatchedTitle}>
              Itens não reconhecidos
            </Text>
            <Text style={styles.unmatchedDescription}>
              Confira estes códigos ou linhas antes de concluir a comparação:
            </Text>
            {textComparison.unmatchedLines.map((line, index) => (
              <Text key={`${line}-${index}`} style={styles.unmatchedLine}>
                {line}
              </Text>
            ))}
          </View>
        ) : null}

        {friendText.trim() &&
        textComparison.needed.length === 0 &&
        textComparison.unmatchedLines.length === 0 ? (
          <EmptyState
            title="Nada novo nessa lista"
            description="Nenhuma figurinha faltante foi encontrada no texto colado."
          />
        ) : null}
      </View>
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
  exportCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionTitle: {
    ...type.section,
    color: colors.text,
  },
  sectionSubtitle: {
    ...type.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  exportActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  primaryAction: {
    flex: 1,
    minHeight: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  primaryActionText: {
    ...type.label,
    color: colors.primaryStrong,
  },
  compareCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  textArea: {
    minHeight: 150,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    padding: spacing.md,
    color: colors.text,
    ...type.body,
  },
  comparisonSummary: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  statText: {
    ...type.caption,
    color: colors.textMuted,
  },
  resultList: {
    gap: spacing.sm,
  },
  unmatchedCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft,
    padding: spacing.md,
    gap: spacing.xs,
  },
  unmatchedTitle: {
    ...type.bodyStrong,
    color: colors.danger,
  },
  unmatchedDescription: {
    ...type.caption,
    color: colors.text,
  },
  unmatchedLine: {
    ...type.code,
    color: colors.text,
  },
  stickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
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
