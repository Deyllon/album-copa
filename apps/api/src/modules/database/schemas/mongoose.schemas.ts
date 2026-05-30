import { CatalogSticker } from "@copa/shared";
import { Schema } from "mongoose";
import { UserFriendRecord } from "../entities/user-friend-record.entity";
import { UserRecord } from "../entities/user-record.entity";
import { UserStickerRecord } from "../entities/user-sticker-record.entity";

export const catalogStickerSchema = new Schema<CatalogSticker>(
  {
    code: { type: String, required: true, unique: true, index: true },
    playerName: { type: String, required: true },
    team: { type: String, required: true, index: true },
    albumPage: { type: Number, required: true, index: true },
    albumPosition: { type: Number, required: true, index: true },
    aliases: { type: [String], default: [] },
  },
  { collection: "catalog_stickers" },
);

export const userSchema = new Schema<UserRecord>(
  {
    id: { type: String, required: true, unique: true, index: true },
    username: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    publicCode: { type: String, required: true, unique: true, index: true },
    createdAt: { type: String, required: true },
  },
  { collection: "users" },
);

export const userStickerSchema = new Schema<UserStickerRecord>(
  {
    userId: { type: String, required: true, index: true },
    code: { type: String, required: true, index: true },
    owned: { type: Boolean, required: true },
    duplicateCount: { type: Number, required: true },
    updatedAt: { type: String, required: true },
  },
  { collection: "user_stickers" },
);

userStickerSchema.index({ userId: 1, code: 1 }, { unique: true });

export const userFriendSchema = new Schema<UserFriendRecord>(
  {
    userId: { type: String, required: true, index: true },
    friendUserId: { type: String, required: true, index: true },
    createdAt: { type: String, required: true },
  },
  { collection: "user_friends" },
);

userFriendSchema.index({ userId: 1, friendUserId: 1 }, { unique: true });
