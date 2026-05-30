import { z } from "zod";
import { importCatalogSchema } from "../schemas/catalog.schemas";

export type ImportCatalogDto = z.infer<typeof importCatalogSchema>;
