import { z } from "zod";
import { credentialsSchema } from "../schemas/auth.schemas";

export type CredentialsDto = z.infer<typeof credentialsSchema>;
