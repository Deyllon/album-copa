import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/current-user.decorator";
import { JwtAuthGuard } from "../../common/jwt-auth.guard";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { AuthenticatedUser } from "../auth/auth.types";
import { SaveFriendDto } from "./dto/save-friend.dto";
import { FriendsService } from "./friends.service";
import { saveFriendSchema } from "./schemas/friends.schemas";

@Controller("friends")
@UseGuards(JwtAuthGuard)
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.friendsService.list(user.id);
  }

  @Post()
  save(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(saveFriendSchema)) body: SaveFriendDto,
  ) {
    return this.friendsService.save(user.id, body.identifier);
  }
}
