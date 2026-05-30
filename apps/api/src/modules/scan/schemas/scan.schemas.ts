import { z } from "zod";

export const scanReviewSchema = z.object({
  mode: z.enum(["code-backs", "album-page"]),
  rawText: z.string().min(1),
  inferredTeam: z.string().optional(),
  inferredPage: z.number().int().positive().optional(),
});

export const scanImageSchema = z.object({
  imageBase64: z.string().min(100), // base64 payload
  mimeType: z.string().optional(),
  mode: z.enum(["code-backs", "album-page"]).optional(),
  inferredTeam: z.string().optional(),
});

export const scanCommitSchema = z.object({
  items: z.array(
    z.object({
      code: z.string().min(2),
      action: z.enum([
        "mark-owned",
        "mark-missing",
        "increment-duplicate",
        "none",
      ]),
    }),
  ),
});
