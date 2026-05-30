import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { UserStickerState } from "@copa/shared";
import { CatalogService } from "../catalog/catalog.service";
import { DatabaseService } from "../database/database.service";
import { UserStickerRecord } from "../database/entities/user-sticker-record.entity";
import { UpdateStickerDto } from "./dto/update-sticker.dto";

@Injectable()
export class AlbumService {
  constructor(
    private readonly catalogService: CatalogService,
    private readonly database: DatabaseService,
  ) {}

  async listUserStates(userId: string): Promise<UserStickerState[]> {
    return (await this.database.listUserStickers(userId))
      .map((state) => ({
        code: state.code,
        owned: state.owned,
        duplicateCount: state.duplicateCount,
      }));
  }

  async getAlbum(userId: string) {
    const stateMap = new Map((await this.listUserStates(userId)).map((state) => [state.code, state]));
    return (await this.catalogService.all()).map((sticker) => ({
      ...sticker,
      owned: stateMap.get(sticker.code)?.owned ?? false,
      duplicateCount: stateMap.get(sticker.code)?.duplicateCount ?? 0,
    }));
  }

  async setSticker(userId: string, code: string, input: UpdateStickerDto): Promise<UserStickerRecord> {
    const sticker = await this.catalogService.findByCode(code);
    if (!sticker) {
      throw new NotFoundException("Sticker not found");
    }

    const current = await this.getOrCreate(userId, sticker.code);
    if (input.owned != null) {
      current.owned = input.owned;
      if (!input.owned) {
        current.duplicateCount = 0;
      }
    }

    if (input.duplicateCount != null) {
      current.duplicateCount = Math.max(0, input.duplicateCount);
      if (current.duplicateCount > 0) {
        current.owned = true;
      }
    }

    if (input.duplicateDelta != null) {
      current.duplicateCount = Math.max(0, current.duplicateCount + input.duplicateDelta);
      if (current.duplicateCount > 0) {
        current.owned = true;
      }
    }

    current.updatedAt = new Date().toISOString();
    return this.database.saveUserSticker(current);
  }

  applyScanAction(userId: string, code: string, action: "mark-owned" | "mark-missing" | "increment-duplicate" | "none") {
    if (action === "none") {
      return this.setSticker(userId, code, {});
    }
    if (action === "mark-owned") {
      return this.setSticker(userId, code, { owned: true });
    }
    if (action === "mark-missing") {
      return this.setSticker(userId, code, { owned: false });
    }
    if (action === "increment-duplicate") {
      return this.setSticker(userId, code, { owned: true, duplicateDelta: 1 });
    }
    throw new BadRequestException("Invalid scan action");
  }

  private async getOrCreate(userId: string, code: string): Promise<UserStickerRecord> {
    const existing = await this.database.findUserSticker(userId, code);
    if (existing) {
      return existing;
    }

    const created: UserStickerRecord = {
      userId,
      code,
      owned: false,
      duplicateCount: 0,
      updatedAt: new Date().toISOString(),
    };
    return created;
  }
}
