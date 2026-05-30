import { BadRequestException, Injectable } from "@nestjs/common";
import { AlbumService } from "../album/album.service";
import { DatabaseService } from "../database/database.service";
import { UserRecord } from "../database/entities/user-record.entity";
import { UsersService } from "../users/users.service";

@Injectable()
export class FriendsService {
  constructor(
    private readonly albumService: AlbumService,
    private readonly database: DatabaseService,
    private readonly usersService: UsersService,
  ) {}

  async list(userId: string) {
    const links = await this.database.listUserFriends(userId);
    const friends = await Promise.all(
      links.map((link) => this.usersService.findById(link.friendUserId)),
    );

    return Promise.all(
      friends
        .filter(Boolean)
        .map((friend) => this.buildFriendProfile(friend as UserRecord)),
    );
  }

  async save(userId: string, identifier: string) {
    const friend = await this.usersService.findPublic(identifier);
    if (friend.id === userId) {
      throw new BadRequestException("You cannot add yourself as friend");
    }

    const existing = await this.database.findUserFriend(userId, friend.id);
    if (!existing) {
      await this.database.saveUserFriend({
        userId,
        friendUserId: friend.id,
        createdAt: new Date().toISOString(),
      });
    }

    return this.buildFriendProfile(friend);
  }

  private async buildFriendProfile(friend: UserRecord) {
    const album = await this.albumService.getAlbum(friend.id);
    return {
      user: {
        username: friend.username,
        publicCode: friend.publicCode,
      },
      ownedCount: album.filter((item) => item.owned).length,
      missingCount: album.filter((item) => !item.owned).length,
      duplicates: album.filter((item) => item.duplicateCount > 0),
      album,
    };
  }
}
