export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function normalizeStickerCode(value: string): string {
  return normalizeText(value).replace(/\s+/g, "");
}

export function hasSuspiciousEncoding(value: string): boolean {
  return /[ÃÂ�]/.test(value);
}

export function getReadablePlayerName(playerName: string, aliases: string[] = []): string {
  const normalizedName = playerName.trim();
  const fallback = aliases.find((alias) => alias.trim().length > 0)?.trim();
  if (fallback && hasSuspiciousEncoding(normalizedName)) {
    return fallback;
  }
  return normalizedName;
}

export function extractStickerCodes(rawText: string): string[] {
  const normalized = normalizeText(rawText);
  const matches = normalized.match(/\b[A-Z]{3}\s*\d{1,3}\b/g) ?? [];
  return matches.map(normalizeStickerCode);
}

export function textIncludesNeedle(haystack: string, needle: string): boolean {
  const normalizedHaystack = ` ${normalizeText(haystack)} `;
  const normalizedNeedle = normalizeText(needle);
  return normalizedNeedle.length > 0 && normalizedHaystack.includes(` ${normalizedNeedle} `);
}
