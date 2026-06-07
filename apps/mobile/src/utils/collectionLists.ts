import {
  extractStickerCodes,
  getReadablePlayerName,
  normalizeText,
} from "@copa/shared";
import { AlbumSticker } from "../hooks/useAlbumApp";

export type CollectionStats = {
  total: number;
  ownedCount: number;
  missingCount: number;
  duplicateCodesCount: number;
  duplicateCopiesCount: number;
  completionPercentage: number;
};

export type TextComparisonResult = {
  needed: AlbumSticker[];
  alreadyOwned: AlbumSticker[];
  unmatchedLines: string[];
};

export function getStickerName(sticker: AlbumSticker) {
  return getReadablePlayerName(sticker.playerName, sticker.aliases);
}

export function isStickerOwned(sticker: AlbumSticker) {
  return sticker.owned || sticker.duplicateCount > 0;
}

export function getStickerTeamCode(sticker: AlbumSticker) {
  return sticker.code.match(/^[A-Z]+/)?.[0] ?? sticker.code;
}

export function sortStickerCodes(left: string, right: string) {
  const leftMatch = left.match(/^([A-Z]+)(\d+)$/);
  const rightMatch = right.match(/^([A-Z]+)(\d+)$/);

  if (!leftMatch || !rightMatch) {
    return left.localeCompare(right);
  }

  return (
    leftMatch[1].localeCompare(rightMatch[1]) ||
    Number(leftMatch[2]) - Number(rightMatch[2])
  );
}

export function sortStickers(left: AlbumSticker, right: AlbumSticker) {
  return (
    left.team.localeCompare(right.team) ||
    left.albumPosition - right.albumPosition ||
    sortStickerCodes(left.code, right.code)
  );
}

export function getCollectionStats(album: AlbumSticker[]): CollectionStats {
  const total = album.length;
  const ownedCount = album.filter(isStickerOwned).length;
  const missingCount = Math.max(total - ownedCount, 0);
  const duplicateCodes = album.filter((sticker) => sticker.duplicateCount > 0);
  const duplicateCopiesCount = duplicateCodes.reduce(
    (sum, sticker) => sum + sticker.duplicateCount,
    0,
  );

  return {
    total,
    ownedCount,
    missingCount,
    duplicateCodesCount: duplicateCodes.length,
    duplicateCopiesCount,
    completionPercentage:
      total === 0 ? 0 : Math.round((ownedCount / total) * 100),
  };
}

export function getDuplicateStickers(album: AlbumSticker[]) {
  return album
    .filter((sticker) => sticker.duplicateCount > 0)
    .sort(sortStickers);
}

export function getMissingStickers(album: AlbumSticker[]) {
  return album.filter((sticker) => !isStickerOwned(sticker)).sort(sortStickers);
}

export function groupStickersByTeamCode(stickers: AlbumSticker[]) {
  const groups = new Map<string, AlbumSticker[]>();
  for (const sticker of stickers) {
    const teamCode = getStickerTeamCode(sticker);
    const current = groups.get(teamCode) ?? [];
    current.push(sticker);
    groups.set(teamCode, current);
  }

  return [...groups.entries()]
    .map(([teamCode, items]) => [
      teamCode,
      [...items].sort(
        (left, right) =>
          left.albumPosition - right.albumPosition ||
          sortStickerCodes(left.code, right.code),
      ),
    ] as const)
    .sort((left, right) => left[0].localeCompare(right[0]));
}

export function getCompletedTeamGroups(album: AlbumSticker[]) {
  return groupStickersByTeamCode(album).filter(([, stickers]) =>
    stickers.every(isStickerOwned),
  );
}

export function buildShareText({
  title,
  stickers,
  includeDuplicates,
}: {
  title: string;
  stickers: AlbumSticker[];
  includeDuplicates: boolean;
}) {
  const sorted = [...stickers].sort(sortStickers);
  if (sorted.length === 0) {
    return `${title}\n\nNenhuma figurinha nesta lista.`;
  }

  const sections: string[] = [];
  let currentTeam = "";
  for (const sticker of sorted) {
    if (currentTeam !== sticker.team) {
      currentTeam = sticker.team;
      sections.push(`\n${currentTeam}`);
    }

    const name = getStickerName(sticker);
    const count = includeDuplicates ? ` (${sticker.duplicateCount})` : "";
    sections.push(
      `- ${sticker.code} | ${String(sticker.albumPosition).padStart(2, "0")} - ${name}${count}`,
    );
  }

  return `${title}\n${sections.join("\n").trimEnd()}`;
}

function matchesTeam(header: string, team: string) {
  const normalizedHeader = normalizeText(header);
  const normalizedTeam = normalizeText(team);

  return (
    normalizedHeader === normalizedTeam ||
    normalizedHeader.includes(normalizedTeam) ||
    normalizedTeam.includes(normalizedHeader)
  );
}

function findTeamFromHeader(line: string, album: AlbumSticker[]) {
  const normalizedLine = normalizeText(line);
  if (!normalizedLine || normalizedLine.startsWith("LINK")) {
    return undefined;
  }

  const teams = [...new Set(album.map((sticker) => sticker.team))];
  return teams
    .filter((team) => matchesTeam(normalizedLine, team))
    .sort((left, right) => right.length - left.length)[0];
}

function isKnownListTitle(line: string) {
  return [
    "MINHAS REPETIDAS",
    "FIGURINHAS QUE FALTAM",
    "REPETIDAS",
    "FALTANTES",
  ].includes(normalizeText(line));
}

function findStickerFromTextItem({
  team,
  position,
  name,
  album,
}: {
  team?: string;
  position: number;
  name: string;
  album: AlbumSticker[];
}) {
  const normalizedName = normalizeText(name);

  if (team) {
    const byTeamAndPosition = album.find(
      (sticker) =>
        matchesTeam(team, sticker.team) && sticker.albumPosition === position,
    );

    if (byTeamAndPosition) {
      return byTeamAndPosition;
    }

    const byTeamAndName = album.find((sticker) => {
      if (!matchesTeam(team, sticker.team)) {
        return false;
      }

      const candidates = [
        sticker.playerName,
        getStickerName(sticker),
        ...sticker.aliases,
      ].map(normalizeText);

      return candidates.some(
        (candidate) =>
          candidate.includes(normalizedName) ||
          normalizedName.includes(candidate),
      );
    });

    if (byTeamAndName) {
      return byTeamAndName;
    }
  }

  return album.find((sticker) => {
    const candidates = [
      sticker.playerName,
      getStickerName(sticker),
      ...sticker.aliases,
    ].map(normalizeText);

    return candidates.some(
      (candidate) =>
        candidate.includes(normalizedName) ||
        normalizedName.includes(candidate),
    );
  });
}

export function compareFriendTextToMissing(
  rawText: string,
  album: AlbumSticker[],
): TextComparisonResult {
  const needed = new Map<string, AlbumSticker>();
  const alreadyOwned = new Map<string, AlbumSticker>();
  const unmatchedLines: string[] = [];
  let currentTeam: string | undefined;

  function addSticker(sticker: AlbumSticker) {
    if (isStickerOwned(sticker)) {
      alreadyOwned.set(sticker.code, sticker);
    } else {
      needed.set(sticker.code, sticker);
    }
  }

  for (const rawLine of rawText.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || /^Vem para o App/i.test(line) || /^Link:/i.test(line)) {
      continue;
    }

    const stickerCodes = extractStickerCodes(line);
    if (stickerCodes.length > 0) {
      for (const code of stickerCodes) {
        const sticker = album.find((item) => item.code === code);
        if (sticker) {
          addSticker(sticker);
        } else {
          unmatchedLines.push(code);
        }
      }
      continue;
    }

    const itemMatch = line.match(/(?:^|\s)(\d{1,3})\s*[-–—]\s*(.+?)(?:\s*\(\d+\))?\s*$/);
    if (!itemMatch) {
      const detectedTeam = findTeamFromHeader(line, album);
      if (detectedTeam) {
        currentTeam = detectedTeam;
      } else if (!isKnownListTitle(line)) {
        unmatchedLines.push(line);
      }
      continue;
    }

    const position = Number(itemMatch[1]);
    const name = itemMatch[2].trim();
    const sticker = findStickerFromTextItem({
      team: currentTeam,
      position,
      name,
      album,
    });

    if (!sticker) {
      unmatchedLines.push(line);
      continue;
    }

    addSticker(sticker);
  }

  return {
    needed: [...needed.values()].sort(sortStickers),
    alreadyOwned: [...alreadyOwned.values()].sort(sortStickers),
    unmatchedLines,
  };
}
