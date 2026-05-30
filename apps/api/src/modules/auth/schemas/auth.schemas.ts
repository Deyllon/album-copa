import { z } from "zod";

const reservedPublicCodeLikePattern = /^[a-zA-Z0-9]{12}$/;

export const credentialsSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-zA-Z0-9_.-]+$/)
    .refine((value) => !reservedPublicCodeLikePattern.test(value), {
      message: "Username cannot use the reserved public code format",
    }),
  password: z.string().min(8).max(128),
});
