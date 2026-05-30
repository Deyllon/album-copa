import { z } from "zod";

export const updateStickerSchema = z.object({
  owned: z.boolean().optional(),
  duplicateDelta: z.number().int().min(-99).max(99).optional(),
  duplicateCount: z.number().int().min(0).max(999).optional(),
});
