import { CatalogSticker } from "./types";
import { getReadablePlayerName, normalizeStickerCode, normalizeText, textIncludesNeedle } from "./normalization";

export interface CatalogSearchInput {
  query?: string;
  albumPage?: number;
  albumPosition?: number;
}

export function normalizeCatalogSticker(sticker: CatalogSticker): CatalogSticker {
  const aliases = sticker.aliases ?? [];
  return {
    ...sticker,
    code: normalizeStickerCode(sticker.code),
    playerName: getReadablePlayerName(sticker.playerName, aliases),
    aliases,
  };
}

export function searchCatalog(catalog: CatalogSticker[], input: CatalogSearchInput): CatalogSticker[] {
  const query = normalizeText(input.query ?? "");
  return catalog
    .map(normalizeCatalogSticker)
    .filter((sticker) => {
      const matchesPage = input.albumPage == null || sticker.albumPage === input.albumPage;
      const matchesPosition = input.albumPosition == null || sticker.albumPosition === input.albumPosition;
      if (!matchesPage || !matchesPosition) {
        return false;
      }

      if (!query) {
        return true;
      }

      const code = normalizeStickerCode(sticker.code);
      const aliases = sticker.aliases.map(normalizeText);
      return (
        code === query.replace(/\s+/g, "") ||
        normalizeText(sticker.playerName).includes(query) ||
        normalizeText(sticker.team).includes(query) ||
        aliases.some((alias) => alias.includes(query))
      );
    })
    .sort((a, b) => a.albumPage - b.albumPage || a.albumPosition - b.albumPosition || a.code.localeCompare(b.code));
}

export function detectTeamFromText(rawText: string, catalog: CatalogSticker[]): string | undefined {
  const teams = [...new Set(catalog.map((item) => item.team))];
  return teams.find((team) => textIncludesNeedle(rawText, team));
}

export function detectPageFromText(rawText: string): number | undefined {
  const normalized = normalizeText(rawText);
  const explicit = normalized.match(/\b(?:PAGINA|PAGE|PAG)\s*(\d{1,3})\b/);
  if (explicit?.[1]) {
    return Number(explicit[1]);
  }
  return undefined;
}
