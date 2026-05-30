import { detectPageFromText, detectTeamFromText, normalizeCatalogSticker } from "./catalog";
import { extractStickerCodes, normalizeText, textIncludesNeedle } from "./normalization";
import { CatalogSticker, ScanMode, ScanReview, ScanReviewItem, UserStickerState } from "./types";

export interface BuildScanReviewInput {
  mode: ScanMode;
  rawText: string;
  inferredTeam?: string;
  inferredPage?: number;
}

function asStateMap(states: UserStickerState[]): Map<string, UserStickerState> {
  return new Map(states.map((state) => [state.code, state]));
}

function toReviewItem(sticker: CatalogSticker, state: UserStickerState | undefined, evidence: string[]): ScanReviewItem {
  if (state?.owned) {
    return {
      code: sticker.code,
      playerName: sticker.playerName,
      team: sticker.team,
      albumPage: sticker.albumPage,
      albumPosition: sticker.albumPosition,
      status: "duplicate",
      action: "increment-duplicate",
      confidence: 0.98,
      evidence,
      duplicateCount: state.duplicateCount,
    };
  }

  return {
    code: sticker.code,
    playerName: sticker.playerName,
    team: sticker.team,
    albumPage: sticker.albumPage,
    albumPosition: sticker.albumPosition,
    status: "new",
    action: "mark-owned",
    confidence: 0.98,
    evidence,
    duplicateCount: 0,
  };
}

function tokenize(value: string): string[] {
  return normalizeText(value).split(" ").filter(Boolean);
}

function levenshteinDistance(left: string, right: string): number {
  if (left === right) {
    return 0;
  }

  if (!left.length) {
    return right.length;
  }

  if (!right.length) {
    return left.length;
  }

  const previous = new Array(right.length + 1).fill(0).map((_, index) => index);
  const current = new Array(right.length + 1).fill(0);

  for (let i = 1; i <= left.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + cost,
      );
    }
    for (let j = 0; j <= right.length; j += 1) {
      previous[j] = current[j];
    }
  }

  return previous[right.length];
}

function isFuzzyWordMatch(inputWord: string, candidateWord: string): boolean {
  if (inputWord === candidateWord) {
    return true;
  }

  const maxDistance = candidateWord.length >= 9 ? 2 : candidateWord.length >= 6 ? 1 : 0;
  return maxDistance > 0 && levenshteinDistance(inputWord, candidateWord) <= maxDistance;
}

function fuzzyNameMatch(rawText: string, alias: string): boolean {
  if (textIncludesNeedle(rawText, alias)) {
    return true;
  }

  const haystackWords = tokenize(rawText);
  const aliasWords = tokenize(alias);

  if (aliasWords.length < 2 || haystackWords.length === 0) {
    return false;
  }

  let exactMatches = 0;
  const allWordsMatch = aliasWords.every((aliasWord) => {
    const matchedWord = haystackWords.find((haystackWord) =>
      isFuzzyWordMatch(haystackWord, aliasWord),
    );

    if (matchedWord === aliasWord) {
      exactMatches += 1;
    }

    return Boolean(matchedWord);
  });

  return allWordsMatch && exactMatches >= 1;
}

function findMatchedStickers(rawText: string, catalog: CatalogSticker[], rawCodes: string[]): Set<string> {
  const matched = new Set<string>();
  const normalizedCodes = new Set(rawCodes);

  for (const sticker of catalog) {
    const aliases = [sticker.playerName, ...sticker.aliases];
    if (
      normalizedCodes.has(sticker.code) ||
      aliases.some((alias) => fuzzyNameMatch(rawText, alias))
    ) {
      matched.add(sticker.code);
    }
  }

  return matched;
}

export function buildScanReview(
  input: BuildScanReviewInput,
  catalogInput: CatalogSticker[],
  userStates: UserStickerState[],
): ScanReview {
  const catalog = catalogInput.map(normalizeCatalogSticker);
  const catalogByCode = new Map(catalog.map((sticker) => [sticker.code, sticker]));
  const stateMap = asStateMap(userStates);
  const rawCodes = extractStickerCodes(input.rawText);

  if (input.mode === "code-backs") {
    const items: ScanReviewItem[] = rawCodes.map((code) => {
      const sticker = catalogByCode.get(code);
      if (!sticker) {
        return {
          code,
          status: "unknown",
          action: "none",
          confidence: 0.4,
          evidence: [code],
        };
      }
      return toReviewItem(sticker, stateMap.get(code), [code]);
    });

    if (items.length === 0) {
      items.push({
        status: "uncertain",
        action: "none",
        confidence: 0.2,
        evidence: [normalizeText(input.rawText)],
      });
    }

    return {
      mode: input.mode,
      inferredTeam: input.inferredTeam,
      inferredPage: input.inferredPage,
      items,
      rawCodes,
    };
  }

  const codeTeam = rawCodes.map((code) => catalogByCode.get(code)?.team).find(Boolean);
  const codePage = rawCodes.map((code) => catalogByCode.get(code)?.albumPage).find(Boolean);
  const inferredTeam = input.inferredTeam ?? codeTeam ?? detectTeamFromText(input.rawText, catalog);
  const inferredPage = input.inferredPage ?? codePage ?? detectPageFromText(input.rawText);
  const targetCatalog = catalog.filter((sticker) => {
    const teamMatches = inferredTeam == null || normalizeText(sticker.team) === normalizeText(inferredTeam);
    const pageMatches = inferredPage == null || sticker.albumPage === inferredPage;
    return teamMatches && pageMatches;
  });
  const matchedCodes = findMatchedStickers(input.rawText, targetCatalog.length > 0 ? targetCatalog : catalog, rawCodes);

  const visibleMatches = (targetCatalog.length > 0 ? targetCatalog : catalog).filter((sticker) =>
    matchedCodes.has(sticker.code),
  );
  const targetCodes = new Set(targetCatalog.map((sticker) => sticker.code));
  const items: ScanReviewItem[] = visibleMatches.map((sticker) => ({
    code: sticker.code,
    playerName: sticker.playerName,
    team: sticker.team,
    albumPage: sticker.albumPage,
    albumPosition: sticker.albumPosition,
    status: "present",
    action: stateMap.get(sticker.code)?.owned ? "none" : "mark-owned",
    confidence: rawCodes.includes(sticker.code) ? 0.98 : 0.82,
    evidence: [sticker.playerName],
    duplicateCount: stateMap.get(sticker.code)?.duplicateCount ?? 0,
  }));

  if (inferredTeam != null && inferredPage != null) {
    for (const sticker of targetCatalog) {
      if (!matchedCodes.has(sticker.code)) {
        items.push({
          code: sticker.code,
          playerName: sticker.playerName,
          team: sticker.team,
          albumPage: sticker.albumPage,
          albumPosition: sticker.albumPosition,
          status: "missing",
          action: "mark-missing",
          confidence: targetCodes.has(sticker.code) ? 0.66 : 0.4,
          evidence: [inferredTeam ?? `page ${inferredPage}`],
          duplicateCount: stateMap.get(sticker.code)?.duplicateCount ?? 0,
        });
      }
    }
  }

  if (items.length === 0) {
    items.push({
      status: "uncertain",
      action: "none",
      confidence: 0.2,
      evidence: [normalizeText(input.rawText)],
    });
  }

  return {
    mode: input.mode,
    inferredTeam,
    inferredPage,
    items: items.sort((a, b) => (a.albumPage ?? 999) - (b.albumPage ?? 999) || (a.albumPosition ?? 999) - (b.albumPosition ?? 999)),
    rawCodes,
  };
}
