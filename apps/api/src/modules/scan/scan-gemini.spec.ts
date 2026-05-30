import {
  buildGeminiPrompt,
  buildGeminiResponseSchema,
} from "./scan-gemini";

describe("scan gemini configuration", () => {
  it("builds a simpler prompt for sticker backs", () => {
    const prompt = buildGeminiPrompt("code-backs", ["BRA4", "ARG2"]);

    expect(prompt).toContain("VERSO");
    expect(prompt).toContain("Sua unica tarefa e identificar codigos");
    expect(prompt).toContain("BRA4");
    expect(prompt).not.toContain("albumPageDetected");
    expect(prompt).not.toContain("teamDetected");
    expect(prompt).not.toContain("playerName");
  });

  it("keeps the album page prompt rich enough for team/page inference", () => {
    const prompt = buildGeminiPrompt("album-page", ["BRA2"]);

    expect(prompt).toContain("album");
    expect(prompt).toContain("albumPageDetected");
    expect(prompt).toContain("teamDetected");
    expect(prompt).toContain("playerName");
  });

  it("uses a minimal response schema for sticker backs", () => {
    const schema = buildGeminiResponseSchema("code-backs");
    const properties = schema.properties.stickersDetected.items.properties;

    expect(schema.required).toEqual(["stickersDetected", "uncertain"]);
    expect(properties.code.type).toBe("string");
    expect(properties.confidence.type).toBe("number");
    expect("playerName" in properties).toBe(false);
  });
});
