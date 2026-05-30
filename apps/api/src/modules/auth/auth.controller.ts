import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { RateLimitGuard } from "../../common/rate-limit.guard";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { AuthService } from "./auth.service";
import { CredentialsDto } from "./dto/credentials.dto";
import { credentialsSchema } from "./schemas/auth.schemas";

@Controller("auth")
@UseGuards(RateLimitGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  register(@Body(new ZodValidationPipe(credentialsSchema)) body: CredentialsDto) {
    return this.authService.register(body.username, body.password);
  }

  @Post("login")
  login(@Body(new ZodValidationPipe(credentialsSchema)) body: CredentialsDto) {
    return this.authService.login(body.username, body.password);
  }
}
