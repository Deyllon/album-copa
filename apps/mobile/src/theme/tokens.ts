import { Platform } from "react-native";

const fontFamilyRegular = Platform.select({
  ios: "System",
  android: "sans-serif",
  default: "sans-serif",
});

const fontFamilyMedium = Platform.select({
  ios: "System",
  android: "sans-serif-medium",
  default: "sans-serif",
});

const fontFamilyMono = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "monospace",
});

export const colors = {
  background: "#f4f7f2",
  backgroundAlt: "#e7efe4",
  surface: "#ffffff",
  surfaceMuted: "#0f5f2f",
  border: "#cfdbcd",
  text: "#102217",
  textMuted: "#5e6d63",
  textOnPrimary: "#ffffff",
  primary: "#17753c",
  primaryStrong: "#0d5b2c",
  primarySoft: "#ddefe2",
  accent: "#ffcd1f",
  accentStrong: "#efb400",
  accentSoft: "#fff2b8",
  accentBlue: "#1954b8",
  accentBlueSoft: "#e7efff",
  danger: "#c14c36",
  dangerSoft: "#f9dfd8",
  white: "#ffffff",
};

export const spacing = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const radius = {
  sm: 6,
  md: 8,
  pill: 999,
};

export const type = {
  eyebrow: {
    fontSize: 11,
    fontFamily: fontFamilyMedium,
    fontWeight: "600" as const,
    lineHeight: 14,
    letterSpacing: 0,
  },
  label: {
    fontSize: 13,
    fontFamily: fontFamilyMedium,
    fontWeight: "600" as const,
    lineHeight: 18,
    letterSpacing: 0,
  },
  body: {
    fontSize: 15,
    fontFamily: fontFamilyRegular,
    fontWeight: "400" as const,
    lineHeight: 22,
    letterSpacing: 0,
  },
  bodyStrong: {
    fontSize: 15,
    fontFamily: fontFamilyMedium,
    fontWeight: "600" as const,
    lineHeight: 22,
    letterSpacing: 0,
  },
  section: {
    fontSize: 18,
    fontFamily: fontFamilyMedium,
    fontWeight: "600" as const,
    lineHeight: 24,
    letterSpacing: 0,
  },
  title: {
    fontSize: 28,
    fontFamily: fontFamilyMedium,
    fontWeight: "600" as const,
    lineHeight: 32,
    letterSpacing: 0,
  },
  code: {
    fontSize: 14,
    fontFamily: fontFamilyMono,
    fontWeight: "600" as const,
    lineHeight: 18,
    letterSpacing: 0,
  },
  caption: {
    fontSize: 13,
    fontFamily: fontFamilyRegular,
    fontWeight: "400" as const,
    lineHeight: 18,
    letterSpacing: 0,
  },
};
