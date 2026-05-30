import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { CatalogSticker, seedCatalog } from "@copa/shared";
import { randomUUID } from "crypto";
import mongoose, { Model } from "mongoose";
import { UserFriendRecord } from "./entities/user-friend-record.entity";
import { UserRecord } from "./entities/user-record.entity";
import { UserStickerRecord } from "./entities/user-sticker-record.entity";
import { getDatabaseModels } from "./schemas/mongoose.models";

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  readonly catalog = new Map<string, CatalogSticker>();
  readonly users = new Map<string, UserRecord>();
  readonly userStickers = new Map<string, UserStickerRecord>();
  readonly userFriends = new Map<string, UserFriendRecord>();
  private catalogModel?: Model<CatalogSticker>;
  private userModel?: Model<UserRecord>;
  private userStickerModel?: Model<UserStickerRecord>;
  private userFriendModel?: Model<UserFriendRecord>;
  private mongoConnected = false;

  constructor() {
    this.importCatalogInMemory(seedCatalog);
  }

  async onModuleInit() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      return;
    }

    const options = process.env.MONGODB_DB ? { dbName: process.env.MONGODB_DB } : undefined;
    await mongoose.connect(uri, options);
    this.mongoConnected = true;
    this.defineModels();
    await this.importCatalog(seedCatalog);
  }

  async onModuleDestroy() {
    if (this.mongoConnected) {
      await mongoose.disconnect();
      this.mongoConnected = false;
    }
  }

  async reset() {
    this.catalog.clear();
    this.users.clear();
    this.userStickers.clear();
    this.userFriends.clear();
    this.importCatalogInMemory(seedCatalog);
    if (this.mongoConnected) {
      await Promise.all([
        this.catalogModel?.deleteMany({}),
        this.userModel?.deleteMany({}),
        this.userStickerModel?.deleteMany({}),
        this.userFriendModel?.deleteMany({}),
      ]);
      await this.importCatalog(seedCatalog);
    }
  }

  async importCatalog(stickers: CatalogSticker[]) {
    this.importCatalogInMemory(stickers);
    if (!this.mongoConnected || !this.catalogModel) {
      return;
    }

    await this.catalogModel.bulkWrite(
      stickers.map((sticker) => ({
        updateOne: {
          filter: { code: sticker.code },
          update: { $set: { ...sticker, aliases: sticker.aliases ?? [] } },
          upsert: true,
        },
      })),
    );
  }

  async listCatalog(): Promise<CatalogSticker[]> {
    if (this.mongoConnected && this.catalogModel) {
      return this.catalogModel.find({}, { _id: 0, __v: 0 }).lean<CatalogSticker[]>();
    }
    return [...this.catalog.values()];
  }

  async findCatalogByCode(code: string): Promise<CatalogSticker | undefined> {
    if (this.mongoConnected && this.catalogModel) {
      return (await this.catalogModel.findOne({ code }, { _id: 0, __v: 0 }).lean<CatalogSticker>()) ?? undefined;
    }
    return this.catalog.get(code);
  }

  async saveUser(user: UserRecord): Promise<UserRecord> {
    this.users.set(user.id, user);
    if (this.mongoConnected && this.userModel) {
      await this.userModel.updateOne({ id: user.id }, { $set: user }, { upsert: true });
    }
    return user;
  }

  async findUserById(id: string): Promise<UserRecord | undefined> {
    if (this.mongoConnected && this.userModel) {
      return (await this.userModel.findOne({ id }, { _id: 0, __v: 0 }).lean<UserRecord>()) ?? undefined;
    }
    return this.users.get(id);
  }

  async findUserByUsername(username: string): Promise<UserRecord | undefined> {
    if (this.mongoConnected && this.userModel) {
      return (await this.userModel.findOne({ username }, { _id: 0, __v: 0 }).lean<UserRecord>()) ?? undefined;
    }
    return [...this.users.values()].find((user) => user.username === username);
  }

  async findUserByPublicCode(publicCode: string): Promise<UserRecord | undefined> {
    if (this.mongoConnected && this.userModel) {
      return (await this.userModel.findOne({ publicCode }, { _id: 0, __v: 0 }).lean<UserRecord>()) ?? undefined;
    }
    return [...this.users.values()].find((user) => user.publicCode === publicCode);
  }

  async listUserStickers(userId: string): Promise<UserStickerRecord[]> {
    if (this.mongoConnected && this.userStickerModel) {
      return this.userStickerModel.find({ userId }, { _id: 0, __v: 0 }).lean<UserStickerRecord[]>();
    }
    return [...this.userStickers.values()].filter((state) => state.userId === userId);
  }

  async findUserSticker(userId: string, code: string): Promise<UserStickerRecord | undefined> {
    if (this.mongoConnected && this.userStickerModel) {
      return (await this.userStickerModel.findOne({ userId, code }, { _id: 0, __v: 0 }).lean<UserStickerRecord>()) ?? undefined;
    }
    return this.userStickers.get(this.userStickerKey(userId, code));
  }

  async saveUserSticker(sticker: UserStickerRecord): Promise<UserStickerRecord> {
    this.userStickers.set(this.userStickerKey(sticker.userId, sticker.code), sticker);
    if (this.mongoConnected && this.userStickerModel) {
      await this.userStickerModel.updateOne(
        { userId: sticker.userId, code: sticker.code },
        { $set: sticker },
        { upsert: true },
      );
    }
    return sticker;
  }

  async listUserFriends(userId: string): Promise<UserFriendRecord[]> {
    if (this.mongoConnected && this.userFriendModel) {
      return this.userFriendModel
        .find({ userId }, { _id: 0, __v: 0 })
        .lean<UserFriendRecord[]>();
    }
    return [...this.userFriends.values()].filter((friend) => friend.userId === userId);
  }

  async findUserFriend(
    userId: string,
    friendUserId: string,
  ): Promise<UserFriendRecord | undefined> {
    if (this.mongoConnected && this.userFriendModel) {
      return (
        (await this.userFriendModel
          .findOne({ userId, friendUserId }, { _id: 0, __v: 0 })
          .lean<UserFriendRecord>()) ?? undefined
      );
    }
    return this.userFriends.get(this.userFriendKey(userId, friendUserId));
  }

  async saveUserFriend(friend: UserFriendRecord): Promise<UserFriendRecord> {
    this.userFriends.set(this.userFriendKey(friend.userId, friend.friendUserId), friend);
    if (this.mongoConnected && this.userFriendModel) {
      await this.userFriendModel.updateOne(
        { userId: friend.userId, friendUserId: friend.friendUserId },
        { $set: friend },
        { upsert: true },
      );
    }
    return friend;
  }

  private importCatalogInMemory(stickers: CatalogSticker[]) {
    for (const sticker of stickers) {
      this.catalog.set(sticker.code, {
        ...sticker,
        aliases: sticker.aliases ?? [],
      });
    }
  }

  private defineModels() {
    const models = getDatabaseModels();
    this.catalogModel = models.catalogModel;
    this.userModel = models.userModel;
    this.userStickerModel = models.userStickerModel;
    this.userFriendModel = models.userFriendModel;
  }

  createId(): string {
    return randomUUID();
  }

  userStickerKey(userId: string, code: string): string {
    return `${userId}:${code}`;
  }

  userFriendKey(userId: string, friendUserId: string): string {
    return `${userId}:${friendUserId}`;
  }
}
