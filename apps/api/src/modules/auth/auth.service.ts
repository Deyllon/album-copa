import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { compareSync } from "bcryptjs";
import { UsersService } from "../users/users.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async register(username: string, password: string) {
    const user = await this.usersService.create(username, password);
    return this.toAuthResponse(user.id, user.username, user.publicCode);
  }

  async login(username: string, password: string) {
    const user = await this.usersService.findByUsername(username);
    if (!user || !compareSync(password, user.passwordHash)) {
      throw new UnauthorizedException("Invalid credentials");
    }
    return this.toAuthResponse(user.id, user.username, user.publicCode);
  }

  private toAuthResponse(id: string, username: string, publicCode: string) {
    return {
      user: { id, username, publicCode },
      accessToken: this.jwtService.sign({ sub: id, username }),
    };
  }
}
