import {
  buildShareText,
  compareFriendTextToMissing,
  getCompletedTeamGroups,
  getCollectionStats,
  getMissingStickers,
  groupStickersByTeamCode,
  sortStickerCodes,
} from "../src/utils/collectionLists";
import { AlbumSticker } from "../src/hooks/useAlbumApp";

const album: AlbumSticker[] = [
  {
    code: "MEX4",
    playerName: "Jorge Sanchez",
    team: "Mexico",
    albumPage: 8,
    albumPosition: 4,
    aliases: ["Jorge Sanchez"],
    owned: false,
    duplicateCount: 0,
  },
  {
    code: "MEX14",
    playerName: "Erick Sanchez",
    team: "Mexico",
    albumPage: 9,
    albumPosition: 14,
    aliases: [],
    owned: true,
    duplicateCount: 2,
  },
  {
    code: "RSA5",
    playerName: "Samukele Kabini",
    team: "Africa do Sul",
    albumPage: 10,
    albumPosition: 5,
    aliases: [],
    owned: false,
    duplicateCount: 1,
  },
  {
    code: "COL10",
    playerName: "Jefferson Lerma",
    team: "Colombia",
    albumPage: 96,
    albumPosition: 10,
    aliases: [],
    owned: false,
    duplicateCount: 0,
  },
];

describe("collection list helpers", () => {
  it("counts duplicates as owned in album progress", () => {
    expect(getCollectionStats(album)).toEqual({
      total: 4,
      ownedCount: 2,
      missingCount: 2,
      duplicateCodesCount: 2,
      duplicateCopiesCount: 3,
      completionPercentage: 50,
    });
  });

  it("does not include duplicate-only stickers in missing lists", () => {
    expect(getMissingStickers(album).map((sticker) => sticker.code)).toEqual([
      "COL10",
      "MEX4",
    ]);
  });

  it("groups stickers by the code prefix", () => {
    expect(
      groupStickersByTeamCode(album).map(([teamCode, stickers]) => [
        teamCode,
        stickers.map((sticker) => sticker.code),
      ]),
    ).toEqual([
      ["COL", ["COL10"]],
      ["MEX", ["MEX4", "MEX14"]],
      ["RSA", ["RSA5"]],
    ]);
  });

  it("sorts sticker codes by their numeric suffix", () => {
    expect(["SUI10", "SUI2", "SUI1"].sort(sortStickerCodes)).toEqual([
      "SUI1",
      "SUI2",
      "SUI10",
    ]);
  });

  it("returns only teams whose stickers are all owned", () => {
    expect(
      getCompletedTeamGroups([
        { ...album[0], owned: true },
        album[1],
        { ...album[2], owned: true },
        album[3],
      ]).map(([teamCode]) => teamCode),
    ).toEqual(["MEX", "RSA"]);
  });

  it("exports duplicate text with sticker codes and counts", () => {
    expect(
      buildShareText({
        title: "Minhas repetidas",
        stickers: album.filter((sticker) => sticker.duplicateCount > 0),
        includeDuplicates: true,
      }),
    ).toContain("MEX14 | 14 - Erick Sanchez (2)");
  });

  it("compares pasted text against my missing stickers", () => {
    const result = compareFriendTextToMissing(
      [
        "Mexico",
        "  - 04 - Jorge Sanchez (2)",
        "  - 14 - Erick Sanchez (2)",
        "Africa do Sul",
        "  - 05 - Samukele Kabini (2)",
        "CC",
        "  - 07 - Jefferson Lerma (2)",
      ].join("\n"),
      album,
    );

    expect(result.needed.map((sticker) => sticker.code)).toEqual([
      "COL10",
      "MEX4",
    ]);
    expect(result.alreadyOwned.map((sticker) => sticker.code)).toEqual([
      "RSA5",
      "MEX14",
    ]);
  });

  it("compares the exact text exported by the app", () => {
    const friendText = buildShareText({
      title: "Minhas repetidas",
      stickers: [album[0], album[1]],
      includeDuplicates: true,
    });

    const result = compareFriendTextToMissing(friendText, album);

    expect(result.needed.map((sticker) => sticker.code)).toEqual(["MEX4"]);
    expect(result.alreadyOwned.map((sticker) => sticker.code)).toEqual(["MEX14"]);
    expect(result.unmatchedLines).toEqual([]);
  });

  it("compares simple sticker-code lists and prioritizes the code in each line", () => {
    const result = compareFriendTextToMissing(
      [
        "MEX4, MEX14",
        "COL10 | 07 - Nome diferente",
      ].join("\n"),
      album,
    );

    expect(result.needed.map((sticker) => sticker.code)).toEqual([
      "COL10",
      "MEX4",
    ]);
    expect(result.alreadyOwned.map((sticker) => sticker.code)).toEqual([
      "MEX14",
    ]);
    expect(result.unmatchedLines).toEqual([]);
  });

  it("reports every sticker code it cannot recognize", () => {
    const result = compareFriendTextToMissing(
      "Minhas repetidas\nMEX4, ABC99\n- 22 - Jogador desconhecido\nTexto desconhecido",
      album,
    );

    expect(result.unmatchedLines).toEqual([
      "ABC99",
      "- 22 - Jogador desconhecido",
      "Texto desconhecido",
    ]);
  });
});
