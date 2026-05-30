import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { ScanMode, ScanReview } from "@copa/shared";
import { sendScanImage } from "../services/api";
import { EmptyState } from "./EmptyState";
import { colors, radius, spacing, type } from "../theme/tokens";

function getConfidenceBadge(confidence: number) {
  if (confidence >= 0.9) {
    return {
      label: "Alta confiança",
      containerStyle: styles.badgeStrong,
      textStyle: styles.badgeStrongText,
    };
  }

  if (confidence >= 0.7) {
    return {
      label: "Confiável",
      containerStyle: styles.badgeMedium,
      textStyle: styles.badgeMediumText,
    };
  }

  return {
    label: "Revisar",
    containerStyle: styles.badgeWeak,
    textStyle: styles.badgeWeakText,
  };
}

function getReviewSummary(status: string, action: string) {
  const statusLabel =
    status === "new"
      ? "Nova leitura"
      : status === "duplicate"
        ? "Repetida"
        : status === "owned"
          ? "Já está no álbum"
          : "Revisar";

  const actionLabel =
    action === "mark-owned"
      ? "vai entrar na coleção"
      : action === "increment-duplicate"
        ? "vai somar repetida"
        : action === "ignore"
          ? "será ignorada"
          : "precisa de ajuste manual";

  return `${statusLabel} - ${actionLabel}`;
}

export function ScanScreen({
  scanMode,
  setScanMode,
  rawText,
  setRawText,
  review,
  reviewManualInput,
  reviewEditMessage,
  reviewEditTone,
  runReview,
  applyReview,
  applyServerReview,
  setReviewManualInput,
  removeReviewItem,
  addReviewItemManually,
}: {
  scanMode: ScanMode;
  setScanMode: (mode: ScanMode) => void;
  rawText: string;
  setRawText: (text: string) => void;
  review: ScanReview | undefined;
  reviewManualInput: string;
  reviewEditMessage: string;
  reviewEditTone: "info" | "success" | "error";
  runReview: () => void;
  applyReview: () => void;
  applyServerReview: (review: ScanReview) => void;
  setReviewManualInput: (value: string) => void;
  removeReviewItem: (index: number) => void;
  addReviewItemManually: () => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedFrameUri, setCapturedFrameUri] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const isCameraLocked = isProcessing || Boolean(review);

  useEffect(() => {
    if (!review && !isProcessing) {
      setCapturedFrameUri(null);
    }
  }, [isProcessing, review]);

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <EmptyState
          title="Câmera bloqueada"
          description="Precisamos da sua permissão para usar a câmera e escanear figurinhas."
        />
        <Pressable
          accessibilityRole="button"
          style={styles.primaryButton}
          onPress={requestPermission}
        >
          <Text style={styles.primaryButtonText}>Conceder permissão</Text>
        </Pressable>
      </View>
    );
  }

  async function handleTakePicture() {
    if (!cameraRef.current || isProcessing) {
      return;
    }

    setIsProcessing(true);

    try {
      console.log("ScanScreen: taking picture");

      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.7,
        skipProcessing: false,
      });

      setCapturedFrameUri(photo.uri ?? null);

      console.log("ScanScreen: photo captured", {
        hasBase64: Boolean(photo.base64),
        base64Length: photo.base64?.length ?? 0,
        uri: photo.uri,
        width: photo.width,
        height: photo.height,
      });

      if (!photo.base64) {
        throw new Error("Camera did not return base64 image");
      }

      console.log("ScanScreen: sending image to backend", {
        mode: scanMode,
        mimeType: "image/jpeg",
        base64Length: photo.base64.length,
      });

      const res = await sendScanImage({
        imageBase64: photo.base64,
        mimeType: "image/jpeg",
        mode: scanMode,
      });

      console.log(
        "ScanScreen: backend raw response",
        JSON.stringify(res, null, 2),
      );

      const serverReview = (res as any)?.data?.items
        ? (res as any).data
        : (res as any)?.items
          ? res
          : (res as any)?.data?.review?.items
            ? (res as any).data.review
            : (res as any)?.review?.items
              ? (res as any).review
              : undefined;

      if (!serverReview?.items) {
        console.error("ScanScreen: invalid review response", res);
        throw new Error("Backend did not return a valid ScanReview with items");
      }

      console.log("ScanScreen: applying server review", {
        itemCount: serverReview.items.length,
        items: serverReview.items.map((item: any) => ({
          code: item.code,
          playerName: item.playerName,
          status: item.status,
          action: item.action,
        })),
      });

      applyServerReview(serverReview as ScanReview);
    } catch (error) {
      console.error("ScanScreen: scan failed", error);
      setCapturedFrameUri(null);
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.helper}>
        Use "Verso" para ler códigos como BRA4. Use "Página" quando a foto mostrar o álbum aberto.
      </Text>

      <View style={styles.segment}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="scan verso"
          accessibilityState={{ selected: scanMode === "code-backs" }}
          style={[
            styles.segmentButton,
            scanMode === "code-backs" && styles.segmentSelected,
            isProcessing && styles.segmentDisabled,
          ]}
          onPress={() => setScanMode("code-backs")}
          disabled={isProcessing}
        >
          <Text style={styles.segmentText}>Verso</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="scan pagina"
          accessibilityState={{ selected: scanMode === "album-page" }}
          style={[
            styles.segmentButton,
            scanMode === "album-page" && styles.segmentSelected,
            isProcessing && styles.segmentDisabled,
          ]}
          onPress={() => setScanMode("album-page")}
          disabled={isProcessing}
        >
          <Text style={styles.segmentText}>Página</Text>
        </Pressable>
      </View>

      {!review ? (
        <View style={styles.cameraBox}>
          {capturedFrameUri ? (
            <Image source={{ uri: capturedFrameUri }} style={styles.camera} />
          ) : (
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing="back"
              active={!isCameraLocked}
            />
          )}
          {isProcessing ? (
            <View style={styles.cameraOverlay}>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text style={styles.cameraOverlayText}>
                Imagem congelada. Processando leitura...
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {!review ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="tirar foto"
          style={[
            styles.primaryButton,
            isProcessing && styles.primaryButtonDisabled,
          ]}
          onPress={handleTakePicture}
          disabled={isProcessing}
        >
          <Text style={styles.primaryButtonText}>Tirar foto</Text>
        </Pressable>
      ) : null}

      {review?.items.map((item, index) => {
        const badge = getConfidenceBadge(item.confidence);

        return (
          <View key={`${item.code ?? "uncertain"}-${index}`} style={styles.reviewItem}>
            <View style={styles.reviewHeader}>
              <View style={styles.reviewCopy}>
                <View style={styles.codeRow}>
                  <Text style={styles.code}>{item.code ?? "incerto"}</Text>
                  <View style={[styles.confidenceBadge, badge.containerStyle]}>
                    <Text style={[styles.confidenceBadgeText, badge.textStyle]}>
                      {badge.label}
                    </Text>
                  </View>
                </View>
                {item.playerName ? (
                  <Text style={styles.name}>{item.playerName}</Text>
                ) : null}
                <Text style={styles.meta}>
                  {getReviewSummary(item.status, item.action)}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`remover item ${item.code ?? index}`}
                style={styles.secondaryButton}
                onPress={() => removeReviewItem(index)}
              >
                <Text style={styles.secondaryButtonText}>Remover</Text>
              </Pressable>
            </View>
          </View>
        );
      })}

      {review ? (
        <View style={styles.manualCard}>
          <Text style={styles.manualTitle}>Ajustar revisão</Text>
          <Text style={styles.manualHelper}>
            Adicione uma figurinha que faltou ou remova uma leitura errada antes de aplicar.
          </Text>
          <TextInput
            accessibilityLabel="adicionar figurinha na revisao"
            value={reviewManualInput}
            onChangeText={setReviewManualInput}
            placeholder="Ex.: BRA3 ou Bento"
            placeholderTextColor={colors.textMuted}
            style={styles.manualInput}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="adicionar na revisao"
            style={styles.secondaryAction}
            onPress={addReviewItemManually}
          >
            <Text style={styles.secondaryActionText}>Adicionar na revisão</Text>
          </Pressable>
          {reviewEditMessage ? (
            <View
              style={[
                styles.feedbackBox,
                reviewEditTone === "success" ? styles.feedbackSuccess : null,
                reviewEditTone === "error" ? styles.feedbackError : null,
              ]}
            >
              <Text
                style={[
                  styles.feedbackText,
                  reviewEditTone === "success"
                    ? styles.feedbackSuccessText
                    : null,
                  reviewEditTone === "error" ? styles.feedbackErrorText : null,
                ]}
              >
                {reviewEditMessage}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {review ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="aplicar revisao"
          style={styles.primaryButton}
          onPress={applyReview}
        >
          <Text style={styles.primaryButtonText}>Aplicar revisão</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    padding: spacing.xl,
    justifyContent: "center",
  },
  helper: {
    ...type.body,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  segment: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  segmentButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.backgroundAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentSelected: {
    backgroundColor: colors.accentSoft,
  },
  segmentDisabled: {
    opacity: 0.6,
  },
  segmentText: {
    ...type.label,
    color: colors.text,
  },
  cameraBox: {
    width: "100%",
    height: 320,
    borderRadius: radius.md,
    overflow: "hidden",
    marginBottom: spacing.md,
    position: "relative",
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraOverlayText: {
    ...type.bodyStrong,
    color: colors.white,
    marginTop: spacing.sm,
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  primaryButtonDisabled: {
    opacity: 0.65,
  },
  primaryButtonText: {
    ...type.bodyStrong,
    color: colors.white,
  },
  reviewItem: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 8,
  },
  reviewHeader: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
  },
  reviewCopy: {
    flex: 1,
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  code: {
    ...type.code,
    color: colors.primaryStrong,
  },
  confidenceBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  confidenceBadgeText: {
    ...type.eyebrow,
  },
  badgeStrong: {
    backgroundColor: colors.primarySoft,
  },
  badgeStrongText: {
    color: colors.primaryStrong,
  },
  badgeMedium: {
    backgroundColor: colors.accentSoft,
  },
  badgeMediumText: {
    color: colors.accentStrong,
  },
  badgeWeak: {
    backgroundColor: colors.dangerSoft,
  },
  badgeWeakText: {
    color: colors.danger,
  },
  name: {
    ...type.bodyStrong,
    color: colors.text,
    marginTop: 2,
  },
  meta: {
    ...type.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  secondaryButton: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.backgroundAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    ...type.label,
    color: colors.primaryStrong,
  },
  manualCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  manualTitle: {
    ...type.section,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  manualHelper: {
    ...type.body,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  manualInput: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    color: colors.text,
    ...type.bodyStrong,
  },
  secondaryAction: {
    minHeight: 48,
    marginTop: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryActionText: {
    ...type.bodyStrong,
    color: colors.primaryStrong,
  },
  feedbackBox: {
    marginTop: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.backgroundAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  feedbackText: {
    ...type.caption,
    color: colors.textMuted,
  },
  feedbackSuccess: {
    backgroundColor: colors.primarySoft,
  },
  feedbackError: {
    backgroundColor: colors.dangerSoft,
  },
  feedbackSuccessText: {
    color: colors.primaryStrong,
  },
  feedbackErrorText: {
    color: colors.danger,
  },
});
