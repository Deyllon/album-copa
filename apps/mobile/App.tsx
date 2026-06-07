import React from "react";
import Constants from "expo-constants";
import {
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAlbumApp } from "./src/hooks/useAlbumApp";
import { useAuth } from "./src/hooks/useAuth";
import { LoginScreen } from "./src/screens/LoginScreen";
import { SignupScreen } from "./src/screens/SignupScreen";
import { AlbumScreen } from "./src/screens/AlbumScreen";
import { CompletedScreen } from "./src/screens/CompletedScreen";
import { DuplicatesScreen } from "./src/screens/DuplicatesScreen";
import { FriendsScreen } from "./src/screens/FriendsScreen";
import { MissingScreen } from "./src/screens/MissingScreen";
import { ScanScreen } from "./src/screens/ScanScreen";
import { SearchScreen } from "./src/screens/SearchScreen";
import { TextListsScreen } from "./src/screens/TextListsScreen";
import { TradesScreen } from "./src/screens/TradesScreen";
import { colors, spacing, type } from "./src/theme/tokens";

export default function App() {
  const auth = useAuth();
  const runtimeGlobal = globalThis as typeof globalThis & { API_BASE?: string };

  try {
    if (!runtimeGlobal.API_BASE) {
      const dbg =
        (Constants.manifest as any)?.debuggerHost ??
        (Constants.manifest2 as any)?.debuggerHost;
      const host = typeof dbg === "string" ? dbg.split(":")[0] : undefined;
      if (host) {
        runtimeGlobal.API_BASE = `http://${host}:3000`;
      }
    }
  } catch {
    // ignore
  }

  const {
    tab,
    setTab,
    query,
    setQuery,
    album,
    scanMode,
    setScanMode,
    rawText,
    setRawText,
    review,
    reviewManualInput,
    reviewEditMessage,
    reviewEditTone,
    searchResults,
    addedFriends,
    myPublicCode,
    friendLookupMessage,
    friendLookupTone,
    refreshAlbum,
    toggleSticker,
    addDuplicate,
    runReview,
    applyReview,
    applyServerReview,
    setReviewManualInput,
    removeReviewItem,
    addReviewItemManually,
    handleAddFriend,
  } = useAlbumApp(auth.user, auth.token);

  const topInset = Math.max(
    StatusBar.currentHeight ?? 0,
    Constants.statusBarHeight ?? 0,
  );
  const headerTopInset = topInset + spacing.md;
  const bottomInset = Platform.select({
    ios: 36,
    android: 38,
    default: 32,
  });
  const [showSignup, setShowSignup] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const tabContentPaddingBottom = spacing.xxl + 104 + (bottomInset ?? 0);
  const primaryTabs = [
    { id: "search", label: "Buscar", icon: "search" },
    { id: "album", label: "Album", icon: "book" },
    { id: "scan", label: "Scan", icon: "camera" },
    { id: "trades", label: "Trocas", icon: "swap-horizontal" },
  ] as const;
  const menuTabs = [
    { id: "duplicates", label: "Repetidas", icon: "copy" },
    { id: "missing", label: "Faltantes", icon: "albums" },
    { id: "completed", label: "Completas", icon: "checkmark-circle" },
    { id: "lists", label: "Listas", icon: "document-text" },
    { id: "friends", label: "Amigos", icon: "people" },
  ] as const;
  const isMenuTabActive = menuTabs.some((item) => item.id === tab);

  function navigateToTab(nextTab: any) {
    setTab(nextTab);
    setMenuOpen(false);
  }

  if (!auth.user) {
    return (
      <View style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={colors.surfaceMuted} />
        <View style={[styles.header, { paddingTop: headerTopInset }]}>
          <View style={styles.headerTopRow}>
            <Text accessibilityRole="header" style={styles.title}>
              Album da Copa
            </Text>
          </View>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          {showSignup ? (
            <SignupScreen
              loading={auth.loading}
              error={auth.error}
              onSignup={async (u, p) => {
                await auth.signUp(u, p);
              }}
              onSwitchToLogin={() => setShowSignup(false)}
            />
          ) : (
            <LoginScreen
              loading={auth.loading}
              error={auth.error}
              onLogin={async (u, p) => {
                await auth.signIn(u, p);
              }}
              onSwitchToSignUp={() => setShowSignup(true)}
            />
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.surfaceMuted} />

      <View style={[styles.header, { paddingTop: headerTopInset }]}>
        <View style={styles.headerTopRow}>
          <Text accessibilityRole="header" style={styles.title}>
            Album da Copa
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="sair"
            style={styles.signOutButton}
            onPress={auth.signOut}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.white} />
            <Text style={styles.signOutText}>Sair</Text>
          </Pressable>
        </View>
        <Text style={styles.subtitle}>
          Organize sua coleção, acompanhe figurinhas repetidas e troque com facilidade.
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: tabContentPaddingBottom },
        ]}
      >
        {tab === "search" ? (
          <SearchScreen
            query={query}
            setQuery={setQuery}
            searchResults={searchResults}
            album={album}
            toggleSticker={toggleSticker}
            addDuplicate={addDuplicate}
          />
        ) : null}

        {tab === "album" ? (
          <AlbumScreen
            album={album}
            toggleSticker={toggleSticker}
            addDuplicate={addDuplicate}
          />
        ) : null}

        {tab === "duplicates" ? (
          <DuplicatesScreen
            album={album}
            addDuplicate={addDuplicate}
          />
        ) : null}

        {tab === "missing" ? (
          <MissingScreen album={album} toggleSticker={toggleSticker} />
        ) : null}

        {tab === "completed" ? <CompletedScreen album={album} /> : null}

        {tab === "lists" ? (
          <TextListsScreen album={album} toggleSticker={toggleSticker} />
        ) : null}

        {tab === "scan" ? (
          <ScanScreen
            scanMode={scanMode}
            setScanMode={setScanMode}
            rawText={rawText}
            setRawText={setRawText}
            review={review}
            reviewManualInput={reviewManualInput}
            reviewEditMessage={reviewEditMessage}
            reviewEditTone={reviewEditTone}
            runReview={runReview}
            applyReview={applyReview}
            applyServerReview={applyServerReview}
            setReviewManualInput={setReviewManualInput}
            removeReviewItem={removeReviewItem}
            addReviewItemManually={addReviewItemManually}
          />
        ) : null}

        {tab === "trades" ? (
          <TradesScreen
            addedFriends={addedFriends}
            token={auth.token}
            onTradeApplied={async () => {
              await refreshAlbum();
            }}
          />
        ) : null}

        {tab === "friends" ? (
          <FriendsScreen
            onAddFriend={handleAddFriend}
            myPublicCode={myPublicCode}
            friendLookupMessage={friendLookupMessage}
            friendLookupTone={friendLookupTone}
            addedFriends={addedFriends}
          />
        ) : null}
      </ScrollView>

      {menuOpen ? (
        <View pointerEvents="box-none" style={styles.menuOverlay}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="fechar menu"
            style={styles.menuBackdrop}
            onPress={() => setMenuOpen(false)}
          />
          <View style={[styles.menuSheet, { bottom: 98 + (bottomInset ?? 0) }]}>
            <Text style={styles.menuTitle}>Menu</Text>
            <View style={styles.menuGrid}>
              {menuTabs.map((item) => {
                const isActive = tab === item.id;
                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: isActive }}
                    style={[styles.menuItem, isActive && styles.menuItemActive]}
                    onPress={() => navigateToTab(item.id)}
                  >
                    <Ionicons
                      name={(isActive ? item.icon : `${item.icon}-outline`) as any}
                      size={20}
                      color={isActive ? colors.white : colors.primaryStrong}
                    />
                    <Text
                      style={[
                        styles.menuItemText,
                        isActive && styles.menuItemTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      ) : null}

      <View
        accessibilityRole="tablist"
        style={[styles.bottomNav, { paddingBottom: 22 + (bottomInset ?? 0) }]}
      >
          {primaryTabs.map((item) => {
            const isActive = tab === item.id;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                style={styles.navItem}
                onPress={() => navigateToTab(item.id)}
              >
                <Ionicons
                  name={(isActive ? item.icon : `${item.icon}-outline`) as any}
                  size={22}
                  color={isActive ? colors.primaryStrong : colors.textMuted}
                />
                <Text style={[styles.navText, isActive && styles.navTextActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: menuOpen || isMenuTabActive }}
            style={styles.navItem}
            onPress={() => setMenuOpen((current) => !current)}
          >
            <Ionicons
              name={menuOpen || isMenuTabActive ? "menu" : "menu-outline"}
              size={22}
              color={menuOpen || isMenuTabActive ? colors.primaryStrong : colors.textMuted}
            />
            <Text
              style={[
                styles.navText,
                (menuOpen || isMenuTabActive) && styles.navTextActive,
              ]}
            >
              Menu
            </Text>
          </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    backgroundColor: colors.surfaceMuted,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  title: {
    ...type.title,
    color: colors.white,
    flexShrink: 1,
  },
  subtitle: {
    ...type.body,
    marginTop: 6,
    color: "#d6e7d7",
    maxWidth: 420,
    lineHeight: 20,
  },
  signOutButton: {
    minHeight: 38,
    paddingHorizontal: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  signOutText: {
    ...type.label,
    color: colors.white,
  },
  content: {
    padding: spacing.md,
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    paddingTop: 10,
    paddingHorizontal: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    elevation: 8,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingVertical: 8,
  },
  navText: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: "600",
    color: colors.textMuted,
  },
  navTextActive: {
    color: colors.primaryStrong,
    fontWeight: "800",
  },
  menuOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  menuSheet: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
  },
  menuTitle: {
    ...type.section,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  menuItem: {
    width: "48%",
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundAlt,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  menuItemActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryStrong,
  },
  menuItemText: {
    ...type.label,
    color: colors.primaryStrong,
  },
  menuItemTextActive: {
    color: colors.white,
  },
});
