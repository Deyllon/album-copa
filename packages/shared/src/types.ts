export type StickerCode = string;

export interface CatalogSticker {
  code: StickerCode;
  playerName: string;
  team: string;
  albumPage: number;
  albumPosition: number;
  aliases: string[];
}

export interface UserStickerState {
  code: StickerCode;
  owned: boolean;
  duplicateCount: number;
}

export type ScanMode = "code-backs" | "album-page";

export type ScanAction = "mark-owned" | "mark-missing" | "increment-duplicate" | "none";

export type ScanStatus = "new" | "duplicate" | "present" | "missing" | "unknown" | "uncertain";

export interface ScanReviewItem {
  code?: StickerCode;
  playerName?: string;
  team?: string;
  albumPage?: number;
  albumPosition?: number;
  status: ScanStatus;
  action: ScanAction;
  confidence: number;
  evidence: string[];
  duplicateCount?: number;
}

export interface ScanReview {
  mode: ScanMode;
  inferredTeam?: string;
  inferredPage?: number;
  items: ScanReviewItem[];
  rawCodes: string[];
}

export interface TradeSticker {
  code: StickerCode;
  playerName: string;
  team: string;
  albumPage: number;
  albumPosition: number;
  duplicateCount: number;
}

export interface TradeComparison {
  iCanOffer: TradeSticker[];
  iNeedFromThem: TradeSticker[];
}
