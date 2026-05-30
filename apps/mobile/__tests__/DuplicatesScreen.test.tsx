import { render, screen, userEvent } from "@testing-library/react-native";
import { DuplicatesScreen } from "../src/screens/DuplicatesScreen";
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
    owned: true,
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
    duplicateCount: 2,
  },
  {
    code: "KSA6",
    playerName: "Hassan Tambakti",
    team: "Arabia Saudita",
    albumPage: 70,
    albumPosition: 6,
    aliases: [],
    owned: false,
    duplicateCount: 0,
  },
];

describe("DuplicatesScreen", () => {
  it("groups duplicates by team code and expands the selected group", async () => {
    const user = userEvent.setup();
    const addDuplicate = jest.fn(async () => undefined);

    render(<DuplicatesScreen album={album} addDuplicate={addDuplicate} />);

    expect(screen.getByText("RSA")).toBeOnTheScreen();
    expect(screen.getByText("KSA")).toBeOnTheScreen();
    expect(screen.queryByText("KSA5")).toBeNull();

    await user.press(screen.getByRole("button", { name: "abrir repetidas KSA" }));

    expect(screen.getByText("KSA5")).toBeOnTheScreen();
    expect(screen.getByText("x2")).toBeOnTheScreen();
    expect(screen.queryByText("KSA6")).toBeNull();

    await user.press(
      screen.getByRole("button", { name: "adicionar outra repetida KSA5" }),
    );
    expect(addDuplicate).toHaveBeenCalledWith("KSA5");
  });
});
