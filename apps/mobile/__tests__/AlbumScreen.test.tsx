import { render, screen, userEvent } from "@testing-library/react-native";
import { AlbumScreen } from "../src/screens/AlbumScreen";
import { AlbumSticker } from "../src/hooks/useAlbumApp";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

const album: AlbumSticker[] = ["SUI10", "SUI2", "SUI1"].map((code, index) => ({
  code,
  playerName: `Jogador ${code}`,
  team: "Suica",
  albumPage: 22,
  albumPosition: Number(code.replace("SUI", "")),
  aliases: [],
  owned: index === 0,
  duplicateCount: 0,
}));

describe("AlbumScreen", () => {
  it("orders stickers inside a team by the numeric code suffix", async () => {
    const user = userEvent.setup();

    render(
      <AlbumScreen
        album={album}
        toggleSticker={jest.fn(async () => undefined)}
        addDuplicate={jest.fn(async () => undefined)}
      />,
    );

    await user.press(screen.getByRole("button", { name: "selecao Suica" }));

    expect(
      screen.getAllByText(/^SUI\d+$/).map((item) => item.props.children),
    ).toEqual(["SUI1", "SUI2", "SUI10"]);
  });
});
