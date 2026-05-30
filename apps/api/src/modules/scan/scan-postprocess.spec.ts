import { seedCatalog } from "@copa/shared";
import { postProcessGeminiScanResult } from "./scan-postprocess";

describe("scan post processing", () => {
  it("keeps strong candidates aligned with detected team and page", () => {
    const result = postProcessGeminiScanResult(
      "album-page",
      {
        albumPageDetected: 10,
        teamDetected: "Africa do Sul",
        stickersDetected: [
          { code: "RSA7", playerName: "Khulumani Indamane", confidence: 0.87 },
        ],
        uncertain: [],
      },
      seedCatalog,
    );

    expect(result.acceptedCodes).toEqual(["RSA7"]);
    expect(result.acceptedCandidates[0].score).toBeGreaterThanOrEqual(0.72);
  });

  it("rejects candidates that conflict with detected team and page", () => {
    const result = postProcessGeminiScanResult(
      "album-page",
      {
        albumPageDetected: 10,
        teamDetected: "Africa do Sul",
        stickersDetected: [
          { code: "BRA2", playerName: "Alisson", confidence: 0.95 },
        ],
        uncertain: [],
      },
      seedCatalog,
    );

    expect(result.acceptedCodes).toEqual([]);
    expect(result.uncertain).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rawText: "BRA2" }),
      ]),
    );
  });

  it("rejects codes outside the catalog", () => {
    const result = postProcessGeminiScanResult(
      "code-backs",
      {
        stickersDetected: [{ code: "AAA999", confidence: 0.99 }],
        uncertain: [],
      },
      seedCatalog,
    );

    expect(result.acceptedCodes).toEqual([]);
    expect(result.uncertain).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rawText: "AAA999" }),
      ]),
    );
  });
});
