import { render, screen, userEvent } from "@testing-library/react-native";
import { MissingScreen } from "../src/screens/MissingScreen";
import { AlbumSticker } from "../src/hooks/useAlbumApp";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

const album: AlbumSticker[] = [
  {
    code: "RSA4",
    playerName: "Aubrey Modiba",
    team: "Africa do Sul",
    albumPage: 10,
    albumPosition: 4,
    aliases: [],
    owned: false,
    duplicateCount: 1,
  },
  {
    code: "KSA5",
    playerName: "Ali Al-Bulaihi",
    team: "Arabia Saudita",
    albumPage: 70,
    albumPosition: 5,
    aliases: [],
    owned: false,
    duplicateCount: 0,
  },
];

describe("MissingScreen", () => {
  it("groups missing stickers by team code and does not show duplicate-only stickers", async () => {
    const user = userEvent.setup();
    const toggleSticker = jest.fn(async () => undefined);

    render(<MissingScreen album={album} toggleSticker={toggleSticker} />);

    expect(screen.queryByText("RSA4")).toBeNull();
    expect(screen.getByText("KSA")).toBeOnTheScreen();
    expect(screen.queryByText("KSA5")).toBeNull();

    await user.press(screen.getByRole("button", { name: "abrir faltantes KSA" }));

    expect(screen.getByText("KSA5")).toBeOnTheScreen();

    await user.press(screen.getByRole("button", { name: "adicionar KSA5 ao álbum" }));
    expect(toggleSticker).toHaveBeenCalledWith("KSA5");
  });
});
