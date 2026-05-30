import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import * as bodyParser from "body-parser";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Accept larger JSON payloads for image uploads (base64 payloads can be large)
  app.use(bodyParser.json({ limit: "10mb" }));
  app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));
  app.enableCors();
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port, "0.0.0.0");
}

void bootstrap();
