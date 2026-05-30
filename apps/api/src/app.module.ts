import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AlbumController } from "./modules/album/album.controller";
import { AlbumService } from "./modules/album/album.service";
import { AuthController } from "./modules/auth/auth.controller";
import { AuthService } from "./modules/auth/auth.service";
import { CatalogController } from "./modules/catalog/catalog.controller";
import { CatalogService } from "./modules/catalog/catalog.service";
import { DatabaseService } from "./modules/database/database.service";
import { FriendsController } from "./modules/friends/friends.controller";
import { FriendsService } from "./modules/friends/friends.service";
import { ScanController } from "./modules/scan/scan.controller";
import { ScanService } from "./modules/scan/scan.service";
import { TradeController } from "./modules/trade/trade.controller";
import { TradeService } from "./modules/trade/trade.service";
import { UsersController } from "./modules/users/users.controller";
import { UsersService } from "./modules/users/users.service";

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? "dev-secret-change-me",
      signOptions: { expiresIn: "7d" },
    }),
  ],
  controllers: [
    AlbumController,
    AuthController,
    CatalogController,
    FriendsController,
    ScanController,
    TradeController,
    UsersController,
  ],
  providers: [
    AlbumService,
    AuthService,
    CatalogService,
    DatabaseService,
    FriendsService,
    ScanService,
    TradeService,
    UsersService,
  ],
})
export class AppModule {}
