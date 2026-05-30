import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { FriendProfile } from "../hooks/useAlbumApp";
import { useTradeBuilder } from "../hooks/useTradeBuilder";
import { colors, radius, spacing, type } from "../theme/tokens";
import { EmptyState } from "./EmptyState";

export function TradesScreen({
  addedFriends,
  token,
  onTradeApplied,
}: {
  addedFriends: FriendProfile[];
  token?: string | null;
  onTradeApplied?: () => Promise<void> | void;
}) {
  const [activeFriend, setActiveFriend] = useState<FriendProfile | null>(null);
  const builder = useTradeBuilder(token ?? undefined);

  async function handleOpenBuilder(friend: FriendProfile) {
    setActiveFriend(friend);
    await builder.loadComparison(friend.user.publicCode);
  }

  async function handleApplyTrade() {
    const result = await builder.executeTrade();
    const offered = builder.selectedOffer.size;
    const requested = builder.selectedReceive.size;
    const message = `Seu album recebeu ${requested} figurinha(s) e consumiu ${offered} repetida(s).`;

    if (result?.success) {
      await onTradeApplied?.();
      if (Platform.OS === "android") {
        ToastAndroid.show("Troca aplicada no seu album!", ToastAndroid.SHORT);
      } else {
        Alert.alert("Troca aplicada", message);
      }
      setActiveFriend(null);
      builder.clear();
      return;
    }

    Alert.alert("Erro", result?.message || "Nao foi possivel aplicar essa troca.");
  }

  if (activeFriend) {
    const comparison = builder.comparison;

    return (
      <View style={styles.builderContainer}>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setActiveFriend(null);
            builder.clear();
          }}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={20} color={colors.primaryStrong} />
          <Text style={styles.backButtonText}>Voltar</Text>
        </Pressable>

        <Text style={styles.builderTitle}>
          Troca com {activeFriend.user.username}
        </Text>

        {builder.loading ? (
          <Text style={styles.loadingText}>Carregando comparação...</Text>
        ) : null}

        {builder.error ? <Text style={styles.errorText}>{builder.error}</Text> : null}

        {comparison ? (
          <>
            <Text style={styles.sectionTitle}>
              Voce entrega ({builder.selectedOffer.size})
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {comparison.iCanOffer.map((item) => {
                const isSelected = builder.selectedOffer.has(item.code);
                return (
                  <Pressable
                    key={item.code}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`Selecionar oferta ${item.code}`}
                    style={[
                      styles.stickerCard,
                      isSelected && styles.stickerCardSelected,
                    ]}
                    onPress={() => builder.toggleOffer(item.code)}
                  >
                    {isSelected ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={colors.white}
                        style={styles.checkIcon}
                      />
                    ) : null}
                    <Text
                      style={[
                        styles.stickerCode,
                        isSelected && styles.stickerCodeSelected,
                      ]}
                    >
                      {item.code}
                    </Text>
                    <Text
                      style={[
                        styles.stickerName,
                        isSelected && styles.stickerNameSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {item.playerName}
                    </Text>
                  </Pressable>
                );
              })}
              {comparison.iCanOffer.length === 0 ? (
                <Text style={styles.emptyText}>
                  Voce nao tem repetidas que este amigo precise agora.
                </Text>
              ) : null}
            </ScrollView>

            <Text style={styles.sectionTitle}>
              Voce recebe ({builder.selectedReceive.size})
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {comparison.iNeedFromThem.map((item) => {
                const isSelected = builder.selectedReceive.has(item.code);
                return (
                  <Pressable
                    key={item.code}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`Selecionar recebimento ${item.code}`}
                    style={[
                      styles.stickerCard,
                      isSelected && styles.stickerCardSelected,
                    ]}
                    onPress={() => builder.toggleReceive(item.code)}
                  >
                    {isSelected ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={colors.white}
                        style={styles.checkIcon}
                      />
                    ) : null}
                    <Text
                      style={[
                        styles.stickerCode,
                        isSelected && styles.stickerCodeSelected,
                      ]}
                    >
                      {item.code}
                    </Text>
                    <Text
                      style={[
                        styles.stickerName,
                        isSelected && styles.stickerNameSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {item.playerName}
                    </Text>
                  </Pressable>
                );
              })}
              {comparison.iNeedFromThem.length === 0 ? (
                <Text style={styles.emptyText}>
                  Este amigo nao tem repetidas que voce precise agora.
                </Text>
              ) : null}
            </ScrollView>

            <View style={styles.builderActions}>
              <Pressable
                accessibilityRole="button"
                style={[
                  styles.sendButton,
                  builder.selectedOffer.size === 0 &&
                    builder.selectedReceive.size === 0 &&
                    styles.sendButtonDisabled,
                ]}
                disabled={
                  builder.selectedOffer.size === 0 &&
                  builder.selectedReceive.size === 0
                }
                onPress={handleApplyTrade}
              >
                <Text style={styles.sendButtonText}>Aplicar no meu album</Text>
              </Pressable>
            </View>
          </>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      <Text style={styles.mainTitle}>Amigos adicionados</Text>
      <Text style={styles.mainSubtitle}>
        Escolha um amigo para comparar o que você pode oferecer e o que falta na sua coleção.
      </Text>

      {addedFriends.length === 0 ? (
        <EmptyState
          title="Nenhum amigo adicionado"
          description="Vá até a aba Amigos e adicione um usuário ou código de compartilhamento."
        />
      ) : null}

      {addedFriends.map((friend) => (
        <Pressable
          key={friend.user.publicCode}
          style={styles.friendCard}
          accessibilityRole="button"
          onPress={() => handleOpenBuilder(friend)}
        >
          <View style={styles.friendCardInfo}>
            <Text style={styles.friendCode}>
              {friend.user.username} ({friend.user.publicCode})
            </Text>
            <Text style={styles.friendMeta}>
              Repetidas: {friend.duplicates.length} | Faltando: {friend.missingCount}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.textMuted}
          />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
  },
  mainTitle: {
    ...type.title,
    fontSize: 20,
    color: colors.text,
  },
  mainSubtitle: {
    ...type.body,
    color: colors.textMuted,
    marginBottom: spacing.md,
    marginTop: 4,
  },
  friendCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  friendCardInfo: {
    flex: 1,
  },
  friendCode: {
    ...type.bodyStrong,
    color: colors.primaryStrong,
    marginBottom: 4,
  },
  friendMeta: {
    ...type.caption,
    color: colors.textMuted,
  },
  builderContainer: {
    flex: 1,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  backButtonText: {
    ...type.bodyStrong,
    color: colors.primaryStrong,
    marginLeft: 6,
  },
  builderTitle: {
    ...type.title,
    fontSize: 20,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...type.section,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  loadingText: {
    ...type.body,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  errorText: {
    ...type.body,
    color: colors.danger,
    marginBottom: spacing.md,
  },
  horizontalList: {
    paddingBottom: spacing.lg,
    paddingRight: spacing.xl,
    gap: spacing.sm,
    flexDirection: "row",
  },
  stickerCard: {
    width: 104,
    height: 110,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    justifyContent: "center",
    position: "relative",
  },
  stickerCardSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryStrong,
    transform: [{ translateY: -6 }],
    shadowColor: colors.primaryStrong,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  checkIcon: {
    position: "absolute",
    top: 4,
    right: 4,
  },
  stickerCode: {
    ...type.code,
    color: colors.primaryStrong,
    marginBottom: 4,
  },
  stickerCodeSelected: {
    color: colors.white,
  },
  stickerName: {
    ...type.caption,
    fontWeight: "600",
    color: colors.text,
  },
  stickerNameSelected: {
    color: colors.white,
  },
  emptyText: {
    ...type.caption,
    color: colors.textMuted,
    marginTop: 8,
    fontStyle: "italic",
  },
  builderActions: {
    marginTop: spacing.xl,
  },
  sendButton: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: colors.surfaceMuted,
  },
  sendButtonText: {
    ...type.bodyStrong,
    color: colors.primaryStrong,
  },
});
