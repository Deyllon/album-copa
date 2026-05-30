import { z } from "zod";
import { proposalSchema } from "../schemas/trade.schemas";

export type ProposalDto = z.infer<typeof proposalSchema>;
