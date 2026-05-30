import { Body, Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/current-user.decorator";
import { JwtAuthGuard } from "../../common/jwt-auth.guard";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { AuthenticatedUser } from "../auth/auth.types";
import { AlbumService } from "./album.service";
import { UpdateStickerDto } from "./dto/update-sticker.dto";
import { updateStickerSchema } from "./schemas/album.schemas";

@Controller("album")
@UseGuards(JwtAuthGuard)
export class AlbumController {
  constructor(private readonly albumService: AlbumService) {}

  @Get("me")
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.albumService.getAlbum(user.id);
  }

  @Patch(":code")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("code") code: string,
    @Body(new ZodValidationPipe(updateStickerSchema)) body: UpdateStickerDto,
  ) {
    return this.albumService.setSticker(user.id, code, body);
  }
}
