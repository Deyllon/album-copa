import { BadRequestException, Injectable } from "@nestjs/common";
import { buildScanReview } from "@copa/shared";
import { AlbumService } from "../album/album.service";
import { CatalogService } from "../catalog/catalog.service";
import { ScanCommitDto } from "./dto/scan-commit.dto";
import { ScanReviewDto } from "./dto/scan-review.dto";
import { ScanReviewEntity } from "./entities/scan-review.entity";
import { buildGeminiPrompt, buildGeminiResponseSchema } from "./scan-gemini";
import { postProcessGeminiScanResult } from "./scan-postprocess";

@Injectable()
export class ScanService {
  constructor(
    private readonly albumService: AlbumService,
    private readonly catalogService: CatalogService,
  ) {}

  async review(
    userId: string,
    input: ScanReviewDto,
  ): Promise<ScanReviewEntity> {
    return buildScanReview(
      input,
      await this.catalogService.all(),
      await this.albumService.listUserStates(userId),
    );
  }

  private logShort(label: string, value: unknown, maxLength = 4000) {
    try {
      const text =
        typeof value === "string" ? value : JSON.stringify(value, null, 2);

      if (!text) {
        console.log(`${label}: <empty>`);
        return;
      }

      console.log(
        `${label}: ${text.length > maxLength ? text.slice(0, maxLength) + "\n...[truncated]" : text}`,
      );
    } catch (error) {
      console.log(`${label}: <unserializable>`, error);
    }
  }

  async reviewImage(
    userId: string,
    input: {
      imageBase64: string;
      mimeType?: string;
      mode?: "code-backs" | "album-page";
      inferredTeam?: string;
    },
  ): Promise<ScanReviewEntity> {
    const mode = input.mode ?? "album-page";
    const mimeType = input.mimeType ?? "image/jpeg";
    const imageBase64 = this.normalizeBase64(input.imageBase64);

    console.log("ScanService: reviewImage start", {
      userId,
      mode,
      mimeType,
      originalBase64Length: input.imageBase64?.length ?? 0,
      normalizedBase64Length: imageBase64.length,
      startsWithDataUrl: input.imageBase64?.startsWith("data:") ?? false,
    });

    if (!imageBase64) {
      throw new BadRequestException("imageBase64 is required");
    }

    const catalog = await this.catalogService.all();
    const userStates = await this.albumService.listUserStates(userId);

    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not set");
      }

      console.log("ScanService: starting Gemini scan");

      const { GoogleGenAI } = await import("@google/genai");

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
      });

      const allowedCodes = catalog.map((item) => item.code);
      const validCodes = new Set(allowedCodes);
      const prompt = buildGeminiPrompt(mode, allowedCodes);
      const scanSchema = buildGeminiResponseSchema(mode);

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: imageBase64,
                },
              },
              {
                text: prompt,
              },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: scanSchema as any,
        },
      } as any);

      const responseAny = response as any;
      const rawGeminiText =
        response.text ??
        responseAny.candidates?.[0]?.content?.parts
          ?.map((part: any) => part.text)
          ?.filter(Boolean)
          ?.join("\n") ??
        "";

      console.log("ScanService: Gemini response metadata", {
        hasText: Boolean(rawGeminiText),
        textLength: rawGeminiText.length,
        candidateCount: responseAny.candidates?.length ?? 0,
        finishReason: responseAny.candidates?.[0]?.finishReason,
        safetyRatings: responseAny.candidates?.[0]?.safetyRatings,
        usageMetadata: responseAny.usageMetadata,
      });

      this.logShort("ScanService: Gemini raw text", rawGeminiText);

      this.logShort("ScanService: Gemini first candidate", {
        content: responseAny.candidates?.[0]?.content,
        finishReason: responseAny.candidates?.[0]?.finishReason,
      });

      let parsed: {
        albumPageDetected?: number;
        teamDetected?: string;
        stickersDetected: Array<{
          code: string;
          playerName?: string;
          confidence: number;
        }>;
        uncertain: Array<{
          rawText: string;
          reason: string;
        }>;
      };

      try {
        parsed = JSON.parse(rawGeminiText || "{}");
      } catch (error) {
        console.error("ScanService: failed to parse Gemini JSON", error);
        this.logShort("ScanService: invalid Gemini JSON", rawGeminiText);
        throw error;
      }

      this.logShort("ScanService: Gemini parsed JSON", parsed);

      const stickersDetected = Array.isArray(parsed.stickersDetected)
        ? parsed.stickersDetected
        : [];

      const uncertain = Array.isArray(parsed.uncertain) ? parsed.uncertain : [];

      const postProcessed = postProcessGeminiScanResult(
        mode,
        {
          albumPageDetected: parsed.albumPageDetected,
          teamDetected: parsed.teamDetected,
          stickersDetected,
          uncertain,
        },
        catalog,
      );

      console.log("ScanService: validated Gemini result", {
        detectedCount: stickersDetected.length,
        highConfidenceCount: postProcessed.acceptedCodes.length,
        highConfidenceCodes: postProcessed.acceptedCodes,
        rejectedCodes: stickersDetected
          .filter((item) => !validCodes.has(item.code))
          .map((item) => item.code),
        uncertainCount: postProcessed.uncertain.length,
        albumPageDetected: parsed.albumPageDetected,
        teamDetected: parsed.teamDetected,
        scores: postProcessed.acceptedCandidates.map((item) => ({
          code: item.code,
          score: item.score,
        })),
      });

      const rawTextForReview = [
        ...postProcessed.acceptedCodes,
        ...postProcessed.uncertain.map((item) => item.rawText).filter(Boolean),
      ].join("\n");

      this.logShort("ScanService: rawTextForReview", rawTextForReview);

      return buildScanReview(
        {
          mode,
          rawText: rawTextForReview,
          inferredTeam: parsed.teamDetected || input.inferredTeam,
          inferredPage:
            parsed.albumPageDetected && parsed.albumPageDetected > 0
              ? parsed.albumPageDetected
              : undefined,
        } as any,
        catalog,
        userStates,
      );
    } catch (error) {
      console.error("ScanService: Gemini scan failed", error);
    }

    try {
      if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        throw new Error("GOOGLE_APPLICATION_CREDENTIALS is not set");
      }

      console.log("ScanService: starting Vision OCR fallback");

      const vision = await import("@google-cloud/vision");
      const client = new vision.ImageAnnotatorClient();

      const [result] = await client.documentTextDetection({
        image: {
          content: Buffer.from(imageBase64, "base64"),
        },
      });

      const rawText =
        result.fullTextAnnotation?.text ??
        result.textAnnotations?.[0]?.description ??
        "";

      console.log("ScanService: Vision OCR result", {
        textLength: rawText.length,
        pages: result.fullTextAnnotation?.pages?.length ?? 0,
      });

      this.logShort("ScanService: Vision OCR raw text", rawText);

      return buildScanReview(
        {
          mode,
          rawText,
          inferredTeam: input.inferredTeam,
        } as any,
        catalog,
        userStates,
      );
    } catch (error) {
      console.error("ScanService: Vision OCR fallback failed", error);
    }

    console.warn(
      "ScanService: all scan methods failed, returning empty review",
    );

    return buildScanReview(
      {
        mode,
        rawText: "",
        inferredTeam: input.inferredTeam,
      } as any,
      catalog,
      userStates,
    );
  }

  private normalizeBase64(value: string): string {
    if (!value) return "";

    const trimmed = value.trim();

    if (trimmed.startsWith("data:")) {
      const commaIndex = trimmed.indexOf(",");

      if (commaIndex >= 0) {
        return trimmed.slice(commaIndex + 1).trim();
      }
    }

    return trimmed;
  }

  async commit(userId: string, items: ScanCommitDto["items"]) {
    const applied = [];
    for (const item of items) {
      if (item.action === "none") {
        continue;
      }
      if (!item.code) {
        throw new BadRequestException("Scan commit items require code");
      }
      applied.push(
        await this.albumService.applyScanAction(userId, item.code, item.action),
      );
    }
    return { applied };
  }
}
