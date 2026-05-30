import { Controller, Get, Param } from "@nestjs/common";
import { AlbumService } from "../album/album.service";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly albumService: AlbumService,
  ) {}

  @Get(":identifier")
  async publicProfile(@Param("identifier") identifier: string) {
    const user = await this.usersService.findPublic(identifier);
    const album = await this.albumService.getAlbum(user.id);
    return {
      user: {
        username: user.username,
        publicCode: user.publicCode,
      },
      ownedCount: album.filter((item) => item.owned).length,
      missingCount: album.filter((item) => !item.owned).length,
      duplicates: album.filter((item) => item.duplicateCount > 0),
      album,
    };
  }
}
