import { z } from "zod";

const optionalPositiveIntSchema = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.coerce.number().int().positive().optional(),
);

export const catalogStickerSchema = z.object({
  code: z.string().min(2),
  playerName: z.string().min(1),
  team: z.string().min(1),
  albumPage: z.coerce.number().int().positive(),
  albumPosition: z.coerce.number().int().positive(),
  aliases: z.array(z.string()).default([]),
});

export const importCatalogSchema = z.union([
  z.object({ stickers: z.array(catalogStickerSchema).min(1) }),
  z.object({ csv: z.string().min(1) }),
]);

export const searchCatalogQuerySchema = z.object({
  q: z.string().optional(),
  page: optionalPositiveIntSchema,
  position: optionalPositiveIntSchema,
});
