import { render, screen, userEvent, waitFor } from "@testing-library/react-native";
import { Share } from "react-native";
import { TextListsScreen } from "../src/screens/TextListsScreen";
import { AlbumSticker } from "../src/hooks/useAlbumApp";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

const album: AlbumSticker[] = [
  {
    code: "MEX4",
    playerName: "Jorge Sanchez",
    team: "Mexico",
    albumPage: 8,
    albumPosition: 4,
    aliases: [],
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
    duplicateCount: 0,
  },
];

describe("TextListsScreen", () => {
  beforeEach(() => {
    jest.spyOn(Share, "share").mockResolvedValue({
      action: Share.sharedAction,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("exports duplicates and missing lists", async () => {
    const user = userEvent.setup();

    render(
      <TextListsScreen
        album={album}
        toggleSticker={jest.fn(async () => undefined)}
      />,
    );

    await user.press(screen.getByRole("button", { name: "exportar repetidas" }));
    await waitFor(() => {
      expect(Share.share).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("MEX14 | 14 - Erick Sanchez (2)"),
        }),
      );
    });

    await user.press(screen.getByRole("button", { name: "exportar faltantes" }));
    await waitFor(() => {
      expect(Share.share).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("MEX4 | 04 - Jorge Sanchez"),
        }),
      );
    });
  });

  it("compares pasted text in the text lists tab", async () => {
    const user = userEvent.setup();
    const toggleSticker = jest.fn(async () => undefined);

    render(<TextListsScreen album={album} toggleSticker={toggleSticker} />);

    await user.type(
      screen.getByLabelText("texto de repetidas do amigo"),
      ["Mexico", "  - 04 - Jorge Sanchez (2)", "  - 14 - Erick Sanchez (2)"].join("\n"),
    );

    expect(screen.getByText("Faltam para você: 1")).toBeOnTheScreen();
    expect(screen.getByText("Você já tem: 1")).toBeOnTheScreen();

    await user.press(
      screen.getByRole("button", { name: "adicionar MEX4 da comparação" }),
    );
    expect(toggleSticker).toHaveBeenCalledWith("MEX4");
  });

  it("shows which pasted items were not recognized", async () => {
    const user = userEvent.setup();

    render(
      <TextListsScreen
        album={album}
        toggleSticker={jest.fn(async () => undefined)}
      />,
    );

    await user.type(
      screen.getByLabelText("texto de repetidas do amigo"),
      "MEX4, ABC99\n- 22 - Jogador desconhecido",
    );

    expect(screen.getByText("Itens não reconhecidos")).toBeOnTheScreen();
    expect(screen.getByText("ABC99")).toBeOnTheScreen();
    expect(screen.getByText("- 22 - Jogador desconhecido")).toBeOnTheScreen();
  });
});
