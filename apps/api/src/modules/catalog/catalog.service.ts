import { BadRequestException, Injectable } from "@nestjs/common";
import { normalizeCatalogSticker, searchCatalog } from "@copa/shared";
import { parse } from "csv-parse/sync";
import { DatabaseService } from "../database/database.service";
import { CatalogSearchDto } from "./dto/catalog-search.dto";
import { CatalogStickerEntity } from "./entities/catalog-sticker.entity";

@Injectable()
export class CatalogService {
  constructor(private readonly database: DatabaseService) {}

  async importJson(stickers: CatalogStickerEntity[]) {
    const normalized = stickers.map(normalizeCatalogSticker);
    this.validateUniqueCodes(normalized);
    await this.database.importCatalog(normalized);
    return { imported: normalized.length };
  }

  importCsv(csv: string) {
    const rows = parse(csv, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Array<Record<string, string>>;

    return this.importJson(
      rows.map((row) => ({
        code: row.code,
        playerName: row.playerName,
        team: row.team,
        albumPage: Number(row.albumPage),
        albumPosition: Number(row.albumPosition),
        aliases: row.aliases ? row.aliases.split("|").map((alias) => alias.trim()).filter(Boolean) : [],
      })),
    );
  }

  async all(): Promise<CatalogStickerEntity[]> {
    return (await this.database.listCatalog()).sort(
      (a, b) => a.albumPage - b.albumPage || a.albumPosition - b.albumPosition || a.code.localeCompare(b.code),
    );
  }

  findByCode(code: string): Promise<CatalogStickerEntity | undefined> {
    return this.database.findCatalogByCode(normalizeCatalogSticker({ code, playerName: "", team: "", albumPage: 0, albumPosition: 0, aliases: [] }).code);
  }

  async search(input: CatalogSearchDto): Promise<CatalogStickerEntity[]> {
    return searchCatalog(await this.all(), input);
  }

  private validateUniqueCodes(stickers: CatalogStickerEntity[]) {
    const seen = new Set<string>();
    for (const sticker of stickers) {
      if (!sticker.code || !sticker.playerName || !sticker.team || !sticker.albumPage || !sticker.albumPosition) {
        throw new BadRequestException("Catalog rows must include code, playerName, team, albumPage and albumPosition");
      }
      if (seen.has(sticker.code)) {
        throw new BadRequestException(`Duplicated catalog code ${sticker.code}`);
      }
      seen.add(sticker.code);
    }
  }
}
