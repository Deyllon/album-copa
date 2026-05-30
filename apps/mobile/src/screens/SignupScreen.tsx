import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radius, spacing, type } from "../theme/tokens";

export function SignupScreen({
  onSignup,
  onSwitchToLogin,
  loading = false,
  error,
}: {
  onSignup: (u: string, p: string) => void | Promise<void>;
  onSwitchToLogin: () => void;
  loading?: boolean;
  error?: string | null;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!username.trim()) {
      setLocalError("Escolha um nome de usuario.");
      return;
    }

    if (password.length < 8) {
      setLocalError("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }

    setLocalError(null);
    await onSignup(username.trim(), password);
  }

  const feedbackMessage = localError || error;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Criar conta</Text>
      <Text style={styles.hint}>
        Use um nome facil de lembrar e uma senha com pelo menos 8 caracteres.
      </Text>
      <TextInput
        accessibilityLabel="novo usuario"
        placeholder="Nome de usuario"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TextInput
        accessibilityLabel="nova senha"
        placeholder="Senha"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        secureTextEntry
      />

      {feedbackMessage ? (
        <View style={styles.feedbackBox}>
          <Text style={styles.feedbackText}>{feedbackMessage}</Text>
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="criar conta"
        style={[styles.button, loading && styles.buttonDisabled]}
        disabled={loading}
        onPress={handleSubmit}
      >
        <Text style={styles.buttonText}>
          {loading ? "Criando..." : "Criar conta"}
        </Text>
      </Pressable>

      <Pressable onPress={onSwitchToLogin} style={styles.linkArea}>
        <Text style={styles.linkText}>Ja tenho conta</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md },
  title: {
    ...type.title,
    fontSize: 20,
    marginBottom: spacing.sm,
    color: colors.text,
  },
  hint: { ...type.body, color: colors.textMuted, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
  },
  feedbackBox: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  feedbackText: {
    ...type.caption,
    color: colors.danger,
  },
  button: {
    backgroundColor: colors.accent,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: { color: colors.primaryStrong, fontWeight: "700" },
  linkArea: { marginTop: spacing.sm, alignItems: "center" },
  linkText: { color: colors.textMuted },
});
