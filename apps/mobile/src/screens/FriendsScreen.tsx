import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { colors, radius, spacing, type } from "../theme/tokens";

export function FriendsScreen({
  onAddFriend,
  myPublicCode,
  friendLookupMessage,
  friendLookupTone,
  addedFriends,
}: {
  onAddFriend: (code: string) => Promise<boolean>;
  myPublicCode: string;
  friendLookupMessage: string;
  friendLookupTone: "info" | "success" | "error";
  addedFriends: Array<{ user: { username: string; publicCode: string } }>;
}) {
  const [friendCode, setFriendCode] = useState("");
  const [copyFeedback, setCopyFeedback] = useState("");

  useEffect(() => {
    if (!copyFeedback) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setCopyFeedback("");
    }, 1800);

    return () => clearTimeout(timeoutId);
  }, [copyFeedback]);

  async function handleAdd() {
    if (friendCode.trim()) {
      const found = await onAddFriend(friendCode.trim());
      if (found) {
        setFriendCode("");
      }
    }
  }

  async function handleCopy(value: string, label: string) {
    await Clipboard.setStringAsync(value);
    setCopyFeedback(`${label} copiado.`);
  }

  return (
    <View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{"Seu c\u00f3digo de compartilhamento"}</Text>
        <View style={styles.codeBlock}>
          <Text style={styles.hashText}>{myPublicCode}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="copiar meu codigo de compartilhamento"
            style={styles.copyIconButton}
            onPress={() => handleCopy(myPublicCode, "C\u00f3digo")}
          >
            <Ionicons name="copy-outline" size={18} color={colors.primaryStrong} />
          </Pressable>
        </View>
        <Text style={styles.cardSubtitle}>
          {"Compartilhe este c\u00f3digo para que seus amigos consultem suas repetidas e comparem trocas com voc\u00ea."}
        </Text>
        {copyFeedback ? (
          <Text style={styles.copyFeedback}>{copyFeedback}</Text>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Adicionar amigo</Text>
        <Text style={styles.cardSubtitle}>
          {"Digite o c\u00f3digo de compartilhamento ou o nome de usu\u00e1rio."}
        </Text>
        <TextInput
          accessibilityLabel="codigo do amigo"
          style={styles.input}
          placeholder="Ex: A1B2C3D4E5F6"
          placeholderTextColor={colors.textMuted}
          value={friendCode}
          autoCapitalize="characters"
          autoCorrect={false}
          onChangeText={(value) => setFriendCode(value.toUpperCase())}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="adicionar"
          style={styles.button}
          onPress={handleAdd}
        >
          <Text style={styles.buttonText}>Salvar amigo para trocas</Text>
        </Pressable>
        {friendLookupMessage ? (
          <View
            style={[
              styles.statusBox,
              friendLookupTone === "success" ? styles.statusSuccess : null,
              friendLookupTone === "error" ? styles.statusError : null,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                friendLookupTone === "success" ? styles.statusSuccessText : null,
                friendLookupTone === "error" ? styles.statusErrorText : null,
              ]}
            >
              {friendLookupMessage}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Amigos salvos</Text>
        <Text style={styles.cardSubtitle}>
          {"Sua lista fica salva na conta para facilitar compara\u00e7\u00f5es futuras."}
        </Text>
        {addedFriends.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum amigo salvo ainda.</Text>
        ) : null}
        {addedFriends.map((friend) => (
          <View key={friend.user.publicCode} style={styles.friendRow}>
            <View style={styles.friendCopyRow}>
              <View style={styles.friendInfo}>
                <Text style={styles.friendName}>{friend.user.username}</Text>
                <Text style={styles.friendCode}>{friend.user.publicCode}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`copiar codigo de ${friend.user.username}`}
                style={styles.copyIconButton}
                onPress={() => handleCopy(friend.user.publicCode, "C\u00f3digo")}
              >
                <Ionicons name="copy-outline" size={18} color={colors.primaryStrong} />
              </Pressable>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardTitle: {
    ...type.section,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  cardSubtitle: {
    ...type.body,
    color: colors.textMuted,
    marginTop: 6,
  },
  codeBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  hashText: {
    ...type.title,
    color: colors.primaryStrong,
    textAlign: "center",
    paddingVertical: 14,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    overflow: "hidden",
    flex: 1,
  },
  copyIconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  copyFeedback: {
    ...type.caption,
    color: colors.primaryStrong,
    marginTop: spacing.sm,
  },
  input: {
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: 14,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    color: colors.text,
    ...type.bodyStrong,
  },
  button: {
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    ...type.bodyStrong,
    color: colors.textOnPrimary,
  },
  statusBox: {
    marginTop: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.backgroundAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  statusSuccess: {
    backgroundColor: colors.primarySoft,
  },
  statusError: {
    backgroundColor: colors.dangerSoft,
  },
  statusText: {
    ...type.caption,
    color: colors.textMuted,
  },
  statusSuccessText: {
    color: colors.primaryStrong,
  },
  statusErrorText: {
    color: colors.danger,
  },
  emptyText: {
    ...type.caption,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  friendRow: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  friendCopyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    ...type.bodyStrong,
    color: colors.text,
  },
  friendCode: {
    ...type.caption,
    color: colors.primaryStrong,
    marginTop: 2,
  },
});
