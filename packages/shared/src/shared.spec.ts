import { buildScanReview, compareTrades, searchCatalog, seedCatalog } from ".";

describe("shared album rules", () => {
  it("loads the Copa 2026 seed catalog", () => {
    expect(seedCatalog).toHaveLength(960);
    expect(searchCatalog(seedCatalog, { query: "MEX2" })[0]?.playerName).toBe("Luis Malagon");
  });

  it("searches by canonical code without translating the prefix", () => {
    expect(searchCatalog(seedCatalog, { query: "BRA2" })[0]?.playerName).toBe("Alisson");
  });

  it("detects duplicate code scans from the sticker back", () => {
    const review = buildScanReview(
      { mode: "code-backs", rawText: "BRA2 BRA3" },
      seedCatalog,
      [{ code: "BRA2", owned: true, duplicateCount: 1 }],
    );

    expect(review.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "BRA2", status: "duplicate", action: "increment-duplicate" }),
        expect.objectContaining({ code: "BRA3", status: "new", action: "mark-owned" }),
      ]),
    );
  });

  it("keeps repeated codes from the same scan batch", () => {
    const review = buildScanReview(
      { mode: "code-backs", rawText: "BRA2 BRA2" },
      seedCatalog,
      [{ code: "BRA2", owned: true, duplicateCount: 1 }],
    );

    expect(review.items.filter((item) => item.code === "BRA2")).toHaveLength(2);
  });

  it("infers an album page and marks missing stickers for review", () => {
    const review = buildScanReview(
      { mode: "album-page", rawText: "Brasil pagina 24 Alisson" },
      seedCatalog,
      [],
    );

    expect(review.inferredTeam).toBe("Brasil");
    expect(review.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "BRA2", status: "present" }),
        expect.objectContaining({ code: "BRA3", status: "missing" }),
      ]),
    );
  });

  it("matches OCR names with small mistakes inside the inferred team/page", () => {
    const review = buildScanReview(
      { mode: "album-page", rawText: "Africa do Sul pagina 10 Khulumani Indamane" },
      seedCatalog,
      [],
    );

    expect(review.inferredTeam).toBe("Africa do Sul");
    expect(review.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "RSA7", status: "present" }),
      ]),
    );
  });

  it("compares repeated stickers against the other user's missing stickers", () => {
    const comparison = compareTrades(
      seedCatalog,
      [{ code: "BRA2", owned: true, duplicateCount: 2 }],
      [{ code: "ARG1", owned: true, duplicateCount: 1 }],
    );

    expect(comparison.iCanOffer.map((item) => item.code)).toContain("BRA2");
    expect(comparison.iNeedFromThem.map((item) => item.code)).toContain("ARG1");
  });
});
