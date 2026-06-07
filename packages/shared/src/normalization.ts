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

export function repairMojibake(value: string): string {
  const trimmed = value.trim();
  if (!hasSuspiciousEncoding(trimmed)) {
    return trimmed;
  }

  try {
    const encodedBytes = Array.from(trimmed)
      .map((character) => {
        const code = character.charCodeAt(0);
        if (code > 255) {
          throw new Error("Not a Latin-1 mojibake string");
        }
        return `%${code.toString(16).padStart(2, "0")}`;
      })
      .join("");
    return decodeURIComponent(encodedBytes);
  } catch {
    return trimmed;
  }
}

export function getReadablePlayerName(playerName: string, aliases: string[] = []): string {
  const normalizedName = repairMojibake(playerName);
  const fallback = aliases
    .map((alias) => alias.trim())
    .filter(Boolean)
    .sort((left, right) => right.length - left.length)[0];
  return fallback && hasSuspiciousEncoding(normalizedName)
    ? repairMojibake(fallback)
    : normalizedName;
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
