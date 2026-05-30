import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { hashSync } from "bcryptjs";
import { DatabaseService } from "../database/database.service";
import { UserRecord } from "../database/entities/user-record.entity";

const PUBLIC_CODE_LENGTH = 12;
const publicCodePattern = new RegExp(`^[A-Z0-9]{${PUBLIC_CODE_LENGTH}}$`);

@Injectable()
export class UsersService {
  constructor(private readonly database: DatabaseService) {}

  async create(username: string, password: string): Promise<UserRecord> {
    const normalizedUsername = username.trim().toLowerCase();
    if (publicCodePattern.test(normalizedUsername.toUpperCase())) {
      throw new BadRequestException("Username cannot use the reserved public code format");
    }
    if (await this.findByUsername(normalizedUsername)) {
      throw new BadRequestException("Username already exists");
    }

    const user: UserRecord = {
      id: this.database.createId(),
      username: normalizedUsername,
      passwordHash: hashSync(password, 10),
      publicCode: await this.createPublicCode(normalizedUsername),
      createdAt: new Date().toISOString(),
    };
    return this.database.saveUser(user);
  }

  findById(id: string): Promise<UserRecord | undefined> {
    return this.database.findUserById(id);
  }

  findByUsername(username: string): Promise<UserRecord | undefined> {
    const normalizedUsername = username.trim().toLowerCase();
    return this.database.findUserByUsername(normalizedUsername);
  }

  findByPublicCode(publicCode: string): Promise<UserRecord | undefined> {
    const normalizedCode = publicCode.trim().toUpperCase();
    return this.database.findUserByPublicCode(normalizedCode);
  }

  async findPublic(identifier: string): Promise<UserRecord> {
    const normalizedIdentifier = identifier.trim();
    const user = publicCodePattern.test(normalizedIdentifier.toUpperCase())
      ? await this.findByPublicCode(normalizedIdentifier)
      : await this.findByUsername(normalizedIdentifier);
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }

  private async createPublicCode(username: string): Promise<string> {
    const _ = username;
    void _;

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const publicCode = this.buildRandomPublicCode();
      if (!(await this.findByPublicCode(publicCode))) {
        return publicCode;
      }
    }
    throw new BadRequestException("Could not generate a unique public code");
  }

  private buildRandomPublicCode(): string {
    let candidate = "";

    while (candidate.length < PUBLIC_CODE_LENGTH) {
      candidate += this.database
        .createId()
        .replace(/[^a-zA-Z0-9]/g, "")
        .toUpperCase();
    }

    return candidate.slice(0, PUBLIC_CODE_LENGTH);
  }
}
