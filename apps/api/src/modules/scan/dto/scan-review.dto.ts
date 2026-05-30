import { z } from "zod";
import { scanReviewSchema } from "../schemas/scan.schemas";

export type ScanReviewDto = z.infer<typeof scanReviewSchema>;
