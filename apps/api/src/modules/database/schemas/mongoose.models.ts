import { CatalogSticker } from "@copa/shared";
import mongoose, { Model } from "mongoose";
import { UserFriendRecord } from "../entities/user-friend-record.entity";
import { UserRecord } from "../entities/user-record.entity";
import { UserStickerRecord } from "../entities/user-sticker-record.entity";
import {
  catalogStickerSchema,
  userFriendSchema,
  userSchema,
  userStickerSchema,
} from "./mongoose.schemas";

export interface DatabaseModels {
  catalogModel: Model<CatalogSticker>;
  userModel: Model<UserRecord>;
  userStickerModel: Model<UserStickerRecord>;
  userFriendModel: Model<UserFriendRecord>;
}

export function getDatabaseModels(): DatabaseModels {
  return {
    catalogModel: (mongoose.models.CatalogSticker as Model<CatalogSticker> | undefined) ?? mongoose.model("CatalogSticker", catalogStickerSchema),
    userModel: (mongoose.models.User as Model<UserRecord> | undefined) ?? mongoose.model("User", userSchema),
    userStickerModel: (mongoose.models.UserSticker as Model<UserStickerRecord> | undefined) ?? mongoose.model("UserSticker", userStickerSchema),
    userFriendModel:
      (mongoose.models.UserFriend as Model<UserFriendRecord> | undefined) ??
      mongoose.model("UserFriend", userFriendSchema),
  };
}
