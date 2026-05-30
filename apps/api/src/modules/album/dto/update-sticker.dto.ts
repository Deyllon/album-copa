import { z } from "zod";
import { updateStickerSchema } from "../schemas/album.schemas";

export type UpdateStickerDto = z.infer<typeof updateStickerSchema>;
