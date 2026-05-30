import { BadRequestException, Injectable } from "@nestjs/common";
import { compareTrades } from "@copa/shared";
import { AlbumService } from "../album/album.service";
import { CatalogService } from "../catalog/catalog.service";
import { UsersService } from "../users/users.service";

@Injectable()
export class TradeService {
  constructor(
    private readonly albumService: AlbumService,
    private readonly catalogService: CatalogService,
    private readonly usersService: UsersService,
  ) {}

  async compare(myUserId: string, otherIdentifier: string) {
    const otherUser = await this.usersService.findPublic(otherIdentifier);
    return {
      otherUser: {
        username: otherUser.username,
        publicCode: otherUser.publicCode,
      },
      ...compareTrades(
        await this.catalogService.all(),
        await this.albumService.listUserStates(myUserId),
        await this.albumService.listUserStates(otherUser.id),
      ),
    };
  }

  async executeTrade(
    myUserId: string,
    payload: { toPublicCode: string; offered?: string[]; requested?: string[] },
  ) {
    const otherUser = await this.usersService.findPublic(payload.toPublicCode);
    const myStates = new Map(
      (await this.albumService.listUserStates(myUserId)).map((item) => [item.code, item]),
    );
    const otherStates = new Map(
      (await this.albumService.listUserStates(otherUser.id)).map((item) => [item.code, item]),
    );
    const offered = payload.offered ?? [];
    const requested = payload.requested ?? [];

    if (offered.length === 0 && requested.length === 0) {
      throw new BadRequestException("Select at least one sticker to trade");
    }

    for (const code of offered) {
      const myState = myStates.get(code);
      if ((myState?.duplicateCount ?? 0) < 1) {
        throw new BadRequestException(`You do not have ${code} available as duplicate`);
      }
    }

    for (const code of requested) {
      const otherState = otherStates.get(code);
      if ((otherState?.duplicateCount ?? 0) < 1) {
        throw new BadRequestException(`Friend does not have ${code} available as duplicate`);
      }
    }

    const spentDuplicates: string[] = [];
    const received: string[] = [];

    for (const code of offered) {
      await this.albumService.setSticker(myUserId, code, { duplicateDelta: -1 });
      spentDuplicates.push(code);
    }

    for (const code of requested) {
      const myState = myStates.get(code);
      await this.albumService.setSticker(
        myUserId,
        code,
        myState?.owned
          ? { owned: true, duplicateDelta: 1 }
          : { owned: true },
      );
      received.push(code);
    }

    return {
      success: true,
      otherUser: {
        username: otherUser.username,
        publicCode: otherUser.publicCode,
      },
      spentDuplicates,
      received,
    };
  }

  // In-memory proposals store (simple prototype). For production use a DB collection.
  private proposals: Array<any> = [];

  async createProposal(
    fromUserId: string,
    payload: { toPublicCode: string; offered?: string[]; requested?: string[] },
  ) {
    const toUser = await this.usersService.findPublic(payload.toPublicCode);
    const id = `proposal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const record = {
      id,
      fromUserId,
      toUserId: toUser.id,
      toPublicCode: payload.toPublicCode,
      offered: payload.offered ?? [],
      requested: payload.requested ?? [],
      createdAt: new Date().toISOString(),
      status: "pending",
    };
    this.proposals.push(record);
    return { success: true, proposal: record };
  }
}
