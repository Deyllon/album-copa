import { DatabaseService } from "../database/database.service";
import { UsersService } from "./users.service";

describe("UsersService", () => {
  it("rejects usernames that collide with the reserved public code format", async () => {
    const service = new UsersService(new DatabaseService());

    await expect(service.create("rafa20261234", "password123")).rejects.toThrow(
      "Username cannot use the reserved public code format",
    );
  });

  it("retries public code generation when a collision happens", async () => {
    const database = new DatabaseService();
    const ids = [
      "user-1",
      "AAAAAAAAAAAA",
      "user-2",
      "AAAAAAAAAAAA",
      "BBBBBBBBBBBB",
    ];
    jest.spyOn(database, "createId").mockImplementation(() => ids.shift() ?? "fallback-id");
    const service = new UsersService(database);

    const first = await service.create("abcdefgh1", "password123");
    const second = await service.create("abcdefgh2", "password123");

    expect(first.publicCode).toBe("AAAAAAAAAAAA");
    expect(second.publicCode).toBe("BBBBBBBBBBBB");
  });

  it("finds a public profile by username or reserved public code without ambiguity", async () => {
    const database = new DatabaseService();
    const ids = [
      "user-1",
      "ABC123XYZ789",
    ];
    jest.spyOn(database, "createId").mockImplementation(() => ids.shift() ?? "fallback-id");
    const service = new UsersService(database);

    const user = await service.create("carol", "password123");

    await expect(service.findPublic("carol")).resolves.toEqual(user);
    await expect(service.findPublic("ABC123XYZ789")).resolves.toEqual(user);
  });
});
