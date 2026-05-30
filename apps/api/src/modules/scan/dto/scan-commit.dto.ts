import { z } from "zod";
import { scanCommitSchema } from "../schemas/scan.schemas";

export type ScanCommitDto = z.infer<typeof scanCommitSchema>;
