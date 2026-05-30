import { z } from "zod";
import { searchCatalogQuerySchema } from "../schemas/catalog.schemas";

export type SearchCatalogQueryDto = z.infer<typeof searchCatalogQuerySchema>;
