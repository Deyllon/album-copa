import {
  CatalogSticker,
  getReadablePlayerName,
  normalizeText,
  ScanMode,
} from "@copa/shared";

type GeminiDetectedSticker = {
  code: string;
  playerName?: string;
  confidence: number;
};

type GeminiUncertainItem = {
  rawText: string;
  reason: string;
};

type GeminiScanResult = {
  albumPageDetected?: number;
  teamDetected?: string;
  stickersDetected: GeminiDetectedSticker[];
  uncertain: GeminiUncertainItem[];
};

export type PostProcessedGeminiCandidate = {
  code: string;
  score: number;
  sticker: CatalogSticker;
};

export type PostProcessedGeminiResult = {
  acceptedCodes: string[];
  acceptedCandidates: PostProcessedGeminiCandidate[];
  uncertain: GeminiUncertainItem[];
};

function levenshteinDistance(left: string, right: string): number {
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
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

function fuzzyNameScore(inputName: string | undefined, sticker: CatalogSticker): number {
  if (!inputName) {
    return 0;
  }

  const normalizedInput = normalizeText(inputName);
  const candidates = [sticker.playerName, ...sticker.aliases]
    .map((value) => getReadablePlayerName(value))
    .map(normalizeText);

  if (candidates.includes(normalizedInput)) {
    return 0.18;
  }

  const bestDistance = candidates.reduce((lowest, candidate) => {
    if (!candidate) {
      return lowest;
    }
    return Math.min(lowest, levenshteinDistance(normalizedInput, candidate));
  }, Number.POSITIVE_INFINITY);

  if (bestDistance <= 2) {
    return 0.1;
  }

  return -0.18;
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function buildRejectionReason(
  sticker: CatalogSticker | undefined,
  teamDetected?: string,
  pageDetected?: number,
): string {
  if (!sticker) {
    return "codigo fora do catalogo";
  }

  const teamMismatch =
    teamDetected &&
    normalizeText(teamDetected) !== normalizeText(sticker.team);

  const pageMismatch =
    pageDetected != null &&
    pageDetected > 0 &&
    pageDetected !== sticker.albumPage;

  if (teamMismatch && pageMismatch) {
    return "codigo conflita com selecao e pagina detectadas";
  }

  if (teamMismatch) {
    return "codigo conflita com a selecao detectada";
  }

  if (pageMismatch) {
    return "codigo conflita com a pagina detectada";
  }

  return "confianca insuficiente";
}

export function scoreGeminiCandidate(
  mode: ScanMode,
  candidate: GeminiDetectedSticker,
  sticker: CatalogSticker | undefined,
  context: { teamDetected?: string; pageDetected?: number },
): number {
  if (!sticker) {
    return 0;
  }

  let score = Math.max(0, Math.min(1, Number(candidate.confidence) || 0));

  if (mode === "code-backs") {
    return clampScore(score);
  }

  const teamDetected = context.teamDetected?.trim();
  const pageDetected = context.pageDetected;

  if (teamDetected) {
    score +=
      normalizeText(teamDetected) === normalizeText(sticker.team) ? 0.18 : -0.45;
  }

  if (pageDetected != null && pageDetected > 0) {
    score += pageDetected === sticker.albumPage ? 0.14 : -0.4;
  }

  score += fuzzyNameScore(candidate.playerName, sticker);

  return clampScore(score);
}

export function postProcessGeminiScanResult(
  mode: ScanMode,
  parsed: GeminiScanResult,
  catalog: CatalogSticker[],
): PostProcessedGeminiResult {
  const catalogByCode = new Map(catalog.map((item) => [item.code, item]));
  const acceptedByCode = new Map<string, PostProcessedGeminiCandidate>();
  const uncertain = [...(Array.isArray(parsed.uncertain) ? parsed.uncertain : [])];
  const threshold = mode === "code-backs" ? 0.75 : 0.72;
  const pageDetected =
    parsed.albumPageDetected && parsed.albumPageDetected > 0
      ? parsed.albumPageDetected
      : undefined;
  const teamDetected = parsed.teamDetected?.trim() || undefined;

  for (const candidate of Array.isArray(parsed.stickersDetected)
    ? parsed.stickersDetected
    : []) {
    const sticker = catalogByCode.get(candidate.code);
    const score = scoreGeminiCandidate(mode, candidate, sticker, {
      teamDetected,
      pageDetected,
    });

    if (!sticker || score < threshold) {
      uncertain.push({
        rawText: candidate.code || candidate.playerName || "desconhecido",
        reason: buildRejectionReason(sticker, teamDetected, pageDetected),
      });
      continue;
    }

    const previous = acceptedByCode.get(candidate.code);
    if (!previous || score > previous.score) {
      acceptedByCode.set(candidate.code, {
        code: candidate.code,
        score,
        sticker,
      });
    }
  }

  const acceptedCandidates = [...acceptedByCode.values()].sort(
    (left, right) => right.score - left.score,
  );

  return {
    acceptedCodes: acceptedCandidates.map((item) => item.code),
    acceptedCandidates,
    uncertain,
  };
}
