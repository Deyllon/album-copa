import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";

describe("Copa Album API", () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  async function register(username: string) {
    const response = await request(app.getHttpServer())
      .post("/auth/register")
      .send({ username, password: "password123" })
      .expect(201);
    return response.body as { user: { publicCode: string }; accessToken: string };
  }

  it("registers, searches catalog by code and exposes a read-only public profile", async () => {
    const auth = await register("andre");

    await request(app.getHttpServer())
      .get("/catalog/search?q=BRA2")
      .expect(200)
      .expect(({ body }) => {
        expect(body[0].playerName).toBe("Alisson");
      });

    await request(app.getHttpServer())
      .get("/catalog/search?page=24&position=2")
      .expect(200)
      .expect(({ body }) => {
        expect(body[0].code).toBe("BRA2");
      });

    await request(app.getHttpServer())
      .get("/catalog/search?q=MEX2")
      .expect(200)
      .expect(({ body }) => {
        expect(body[0].playerName).toBe("Luis Malagon");
      });

    await request(app.getHttpServer())
      .patch("/album/BRA2")
      .set("Authorization", `Bearer ${auth.accessToken}`)
      .send({ owned: true, duplicateCount: 1 })
      .expect(200);

    await request(app.getHttpServer())
      .get(`/users/${auth.user.publicCode}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.user.publicCode).toBe(auth.user.publicCode);
        expect(body.duplicates[0].code).toBe("BRA2");
      });
  });

  it("compares my repeated stickers with another user's missing stickers", async () => {
    const me = await register("meuser");
    const other = await register("friend");

    await request(app.getHttpServer())
      .patch("/album/BRA2")
      .set("Authorization", `Bearer ${me.accessToken}`)
      .send({ owned: true, duplicateCount: 2 })
      .expect(200);

    await request(app.getHttpServer())
      .patch("/album/ARG1")
      .set("Authorization", `Bearer ${other.accessToken}`)
      .send({ owned: true, duplicateCount: 1 })
      .expect(200);

    await request(app.getHttpServer())
      .get(`/trades/compare/${other.user.publicCode}`)
      .set("Authorization", `Bearer ${me.accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.iCanOffer.map((item: { code: string }) => item.code)).toContain("BRA2");
        expect(body.iNeedFromThem.map((item: { code: string }) => item.code)).toContain("ARG1");
      });
  });

  it("saves friends in the backend and lists them later", async () => {
    const me = await register("friend_owner");
    const other = await register("friend_target");

    await request(app.getHttpServer())
      .post("/friends")
      .set("Authorization", `Bearer ${me.accessToken}`)
      .send({ identifier: other.user.publicCode })
      .expect(201)
      .expect(({ body }) => {
        expect(body.user.publicCode).toBe(other.user.publicCode);
      });

    await request(app.getHttpServer())
      .get("/friends")
      .set("Authorization", `Bearer ${me.accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              user: expect.objectContaining({
                publicCode: other.user.publicCode,
              }),
            }),
          ]),
        );
      });
  });

  it("applies a trade only to my album without changing the friend's album", async () => {
    const me = await register("traderme");
    const other = await register("trader_friend");

    await request(app.getHttpServer())
      .patch("/album/BRA2")
      .set("Authorization", `Bearer ${me.accessToken}`)
      .send({ owned: true, duplicateCount: 2 })
      .expect(200);

    await request(app.getHttpServer())
      .patch("/album/BRA3")
      .set("Authorization", `Bearer ${other.accessToken}`)
      .send({ owned: true, duplicateCount: 1 })
      .expect(200);

    await request(app.getHttpServer())
      .post("/trades/execute")
      .set("Authorization", `Bearer ${me.accessToken}`)
      .send({
        toPublicCode: other.user.publicCode,
        offered: ["BRA2"],
        requested: ["BRA3"],
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.success).toBe(true);
        expect(body.received).toContain("BRA3");
        expect(body.spentDuplicates).toContain("BRA2");
      });

    await request(app.getHttpServer())
      .get("/album/me")
      .set("Authorization", `Bearer ${me.accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        const bra2 = body.find((item: { code: string }) => item.code === "BRA2");
        const bra3 = body.find((item: { code: string }) => item.code === "BRA3");
        expect(bra2.duplicateCount).toBe(1);
        expect(bra2.owned).toBe(true);
        expect(bra3.owned).toBe(true);
      });

    await request(app.getHttpServer())
      .get("/album/me")
      .set("Authorization", `Bearer ${other.accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        const bra3 = body.find((item: { code: string }) => item.code === "BRA3");
        expect(bra3.duplicateCount).toBe(1);
        expect(bra3.owned).toBe(true);
      });
  });

  it("reviews code-back scans and commits duplicates", async () => {
    const auth = await register("scanner");

    await request(app.getHttpServer())
      .patch("/album/BRA2")
      .set("Authorization", `Bearer ${auth.accessToken}`)
      .send({ owned: true })
      .expect(200);

    const review = await request(app.getHttpServer())
      .post("/scans/review")
      .set("Authorization", `Bearer ${auth.accessToken}`)
      .send({ mode: "code-backs", rawText: "BRA2 BRA3" })
      .expect(201);

    expect(review.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "BRA2", action: "increment-duplicate" }),
        expect.objectContaining({ code: "BRA3", action: "mark-owned" }),
      ]),
    );

    await request(app.getHttpServer())
      .post("/scans/commit")
      .set("Authorization", `Bearer ${auth.accessToken}`)
      .send({
        items: review.body.items
          .filter((item: { code?: string; action: string }) => item.code && item.action !== "none")
          .map((item: { code: string; action: string }) => ({
            code: item.code,
            action: item.action,
          })),
      })
      .expect(201);

    await request(app.getHttpServer())
      .get("/album/me")
      .set("Authorization", `Bearer ${auth.accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        const bra2 = body.find((item: { code: string }) => item.code === "BRA2");
        const bra3 = body.find((item: { code: string }) => item.code === "BRA3");
        expect(bra2.duplicateCount).toBe(1);
        expect(bra3.owned).toBe(true);
      });
  });

  it("rejects protected writes without a bearer token", async () => {
    await request(app.getHttpServer())
      .post("/catalog/import")
      .send({
        stickers: [
          {
            code: "AAA1",
            playerName: "A",
            team: "A",
            albumPage: 1,
            albumPosition: 1,
            aliases: [],
          },
        ],
      })
      .expect(401);
  });

  it("rejects invalid catalog search position filters", async () => {
    await request(app.getHttpServer())
      .get("/catalog/search?page=nope")
      .expect(400);

    await request(app.getHttpServer())
      .get("/catalog/search?position=0")
      .expect(400);
  });
});
