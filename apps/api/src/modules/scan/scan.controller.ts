import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/current-user.decorator";
import { JwtAuthGuard } from "../../common/jwt-auth.guard";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { AuthenticatedUser } from "../auth/auth.types";
import { ScanService } from "./scan.service";
import { ScanCommitDto } from "./dto/scan-commit.dto";
import { ScanReviewDto } from "./dto/scan-review.dto";
import { ScanImageDto } from "./dto/scan-image.dto";
import {
  scanCommitSchema,
  scanReviewSchema,
  scanImageSchema,
} from "./schemas/scan.schemas";

@Controller("scans")
@UseGuards(JwtAuthGuard)
export class ScanController {
  constructor(private readonly scanService: ScanService) {}

  @Post("review")
  review(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(scanReviewSchema)) body: ScanReviewDto,
  ) {
    return this.scanService.review(user.id, body);
  }

  @Post("image")
  reviewImage(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(scanImageSchema)) body: ScanImageDto,
  ) {
    try {
      const size = body.imageBase64 ? body.imageBase64.length : 0;
      console.log(
        `ScanController: reviewImage received for user=${user.id} imageBase64Length=${size}`,
      );
    } catch (err: any) {
      console.warn("ScanController: failed to log incoming image metadata", err);
    }
    return this.scanService.reviewImage(user.id, body);
  }

  @Post("commit")
  commit(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(scanCommitSchema)) body: ScanCommitDto,
  ) {
    // Use `any` cast to avoid TypeScript circular-type issues during runtime
    return (this.scanService as any).commit(user.id, body.items);
  }
}
