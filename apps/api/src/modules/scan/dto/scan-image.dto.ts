import { z } from "zod";
import { scanImageSchema } from "../schemas/scan.schemas";

export type ScanImageDto = z.infer<typeof scanImageSchema>;
