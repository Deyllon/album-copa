import { z } from "zod";

export const proposalSchema = z.object({
  toPublicCode: z.string().min(3),
  offered: z.array(z.string()).nonempty().optional(),
  requested: z.array(z.string()).nonempty().optional(),
});
