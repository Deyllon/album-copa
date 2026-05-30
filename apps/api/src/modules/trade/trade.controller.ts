import { Controller, Get, Param, UseGuards, Post, Body } from "@nestjs/common";
import { CurrentUser } from "../../common/current-user.decorator";
import { JwtAuthGuard } from "../../common/jwt-auth.guard";
import { AuthenticatedUser } from "../auth/auth.types";
import { TradeService } from "./trade.service";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { proposalSchema } from "./schemas/trade.schemas";
import { ProposalDto } from "./dto/proposal.dto";

@Controller("trades")
@UseGuards(JwtAuthGuard)
export class TradeController {
  constructor(private readonly tradeService: TradeService) {}

  @Get("compare/:identifier")
  compare(
    @CurrentUser() user: AuthenticatedUser,
    @Param("identifier") identifier: string,
  ) {
    return this.tradeService.compare(user.id, identifier);
  }

  @Post("proposals")
  createProposal(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(proposalSchema)) body: ProposalDto,
  ) {
    return this.tradeService.createProposal(user.id, body);
  }

  @Post("execute")
  executeTrade(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(proposalSchema)) body: ProposalDto,
  ) {
    return this.tradeService.executeTrade(user.id, body);
  }
}
