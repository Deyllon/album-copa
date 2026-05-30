import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radius, spacing, type } from "../theme/tokens";

export function LoginScreen({
  onLogin,
  onSwitchToSignUp,
  loading = false,
  error,
}: {
  onLogin: (u: string, p: string) => void | Promise<void>;
  onSwitchToSignUp: () => void;
  loading?: boolean;
  error?: string | null;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!username.trim() || !password) {
      setLocalError("Preencha seu usuario e sua senha.");
      return;
    }

    setLocalError(null);
    await onLogin(username.trim(), password);
  }

  const feedbackMessage = localError || error;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Entrar na sua colecao</Text>
      <TextInput
        accessibilityLabel="usuario"
        placeholder="Nome de usuario"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TextInput
        accessibilityLabel="senha"
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
        accessibilityLabel="entrar"
        style={[styles.button, loading && styles.buttonDisabled]}
        disabled={loading}
        onPress={handleSubmit}
      >
        <Text style={styles.buttonText}>{loading ? "Entrando..." : "Entrar"}</Text>
      </Pressable>

      <Pressable onPress={onSwitchToSignUp} style={styles.linkArea}>
        <Text style={styles.linkText}>Ainda nao tem conta? Criar conta</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md },
  title: {
    ...type.title,
    fontSize: 22,
    marginBottom: spacing.md,
    color: colors.text,
  },
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
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: { color: colors.white, fontWeight: "700" },
  linkArea: { marginTop: spacing.sm, alignItems: "center" },
  linkText: { color: colors.primaryStrong },
});
