import { normalizeCatalogSticker } from "./catalog";
import { CatalogSticker, TradeComparison, TradeSticker, UserStickerState } from "./types";

function stateMap(states: UserStickerState[]): Map<string, UserStickerState> {
  return new Map(states.map((state) => [state.code, state]));
}

function toTradeSticker(sticker: CatalogSticker, duplicateCount: number): TradeSticker {
  return {
    code: sticker.code,
    playerName: sticker.playerName,
    team: sticker.team,
    albumPage: sticker.albumPage,
    albumPosition: sticker.albumPosition,
    duplicateCount,
  };
}

export function compareTrades(
  catalogInput: CatalogSticker[],
  myStates: UserStickerState[],
  otherStates: UserStickerState[],
): TradeComparison {
  const catalog = catalogInput.map(normalizeCatalogSticker);
  const mine = stateMap(myStates);
  const other = stateMap(otherStates);

  const iCanOffer: TradeSticker[] = [];
  const iNeedFromThem: TradeSticker[] = [];

  for (const sticker of catalog) {
    const myState = mine.get(sticker.code);
    const otherState = other.get(sticker.code);

    if ((myState?.duplicateCount ?? 0) > 0 && !otherState?.owned) {
      iCanOffer.push(toTradeSticker(sticker, myState?.duplicateCount ?? 0));
    }

    if ((otherState?.duplicateCount ?? 0) > 0 && !myState?.owned) {
      iNeedFromThem.push(toTradeSticker(sticker, otherState?.duplicateCount ?? 0));
    }
  }

  return {
    iCanOffer: iCanOffer.sort((a, b) => a.albumPage - b.albumPage || a.albumPosition - b.albumPosition),
    iNeedFromThem: iNeedFromThem.sort((a, b) => a.albumPage - b.albumPage || a.albumPosition - b.albumPosition),
  };
}
