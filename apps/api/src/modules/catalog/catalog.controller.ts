import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/jwt-auth.guard";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { CatalogService } from "./catalog.service";
import { ImportCatalogDto } from "./dto/import-catalog.dto";
import { SearchCatalogQueryDto } from "./dto/search-catalog-query.dto";
import { importCatalogSchema, searchCatalogQuerySchema } from "./schemas/catalog.schemas";

@Controller("catalog")
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get("search")
  search(@Query(new ZodValidationPipe(searchCatalogQuerySchema)) query: SearchCatalogQueryDto) {
    return this.catalogService.search({
      query: query.q,
      albumPage: query.page,
      albumPosition: query.position,
    });
  }

  @Post("import")
  @UseGuards(JwtAuthGuard)
  import(@Body(new ZodValidationPipe(importCatalogSchema)) body: ImportCatalogDto) {
    if ("csv" in body) {
      return this.catalogService.importCsv(body.csv);
    }
    return this.catalogService.importJson(body.stickers);
  }
}
