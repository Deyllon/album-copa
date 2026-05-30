import { z } from "zod";

export const saveFriendSchema = z.object({
  identifier: z.string().min(3).max(64),
});
