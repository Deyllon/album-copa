import { render, screen } from "@testing-library/react-native";
import { CompletedScreen } from "../src/screens/CompletedScreen";
import { AlbumSticker } from "../src/hooks/useAlbumApp";

const album: AlbumSticker[] = [
  {
    code: "BRA1",
    playerName: "Emblem",
    team: "Brasil",
    albumPage: 24,
    albumPosition: 1,
    aliases: [],
    owned: true,
    duplicateCount: 0,
  },
  {
    code: "BRA2",
    playerName: "Alisson",
    team: "Brasil",
    albumPage: 24,
    albumPosition: 2,
    aliases: [],
    owned: false,
    duplicateCount: 1,
  },
  {
    code: "MEX1",
    playerName: "Emblem",
    team: "Mexico",
    albumPage: 8,
    albumPosition: 1,
    aliases: [],
    owned: true,
    duplicateCount: 0,
  },
  {
    code: "MEX2",
    playerName: "Luis Malagon",
    team: "Mexico",
    albumPage: 8,
    albumPosition: 2,
    aliases: [],
    owned: false,
    duplicateCount: 0,
  },
];

describe("CompletedScreen", () => {
  it("shows only completed teams and counts duplicate-only stickers as owned", () => {
    render(<CompletedScreen album={album} />);

    expect(screen.getByText("Brasil")).toBeOnTheScreen();
    expect(screen.getByText("BRA")).toBeOnTheScreen();
    expect(screen.getByText("2/2")).toBeOnTheScreen();
    expect(screen.queryByText("Mexico")).toBeNull();
  });
});
