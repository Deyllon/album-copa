import { render, screen, userEvent, waitFor } from "@testing-library/react-native";
import App from "../App";

const mockAsyncStorageState = new Map<string, string>();
const mockSendScanImage = jest.fn();
const mockTakePictureAsync = jest.fn();
const mockGetMyAlbum = jest.fn();
const mockUpdateMySticker = jest.fn();
const mockGetFriends = jest.fn();
const mockAddFriend = jest.fn();
const mockSendScanCommit = jest.fn();
const mockExecuteTrade = jest.fn();
const mockSignOut = jest.fn();
const mockSetClipboardString = jest.fn();

const baseAlbum = [
  {
    code: "BRA2",
    playerName: "Alisson",
    team: "Brasil",
    albumPage: 24,
    albumPosition: 2,
    aliases: [],
    owned: true,
    duplicateCount: 0,
  },
  {
    code: "BRA3",
    playerName: "Bento",
    team: "Brasil",
    albumPage: 24,
    albumPosition: 3,
    aliases: [],
    owned: false,
    duplicateCount: 0,
  },
  {
    code: "BRA4",
    playerName: "Marquinhos",
    team: "Brasil",
    albumPage: 24,
    albumPosition: 4,
    aliases: [],
    owned: false,
    duplicateCount: 0,
  },
];

jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async (key: string) => mockAsyncStorageState.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      mockAsyncStorageState.set(key, value);
    }),
    removeItem: jest.fn(async (key: string) => {
      mockAsyncStorageState.delete(key);
    }),
  },
}));

jest.mock("../src/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "user-1", username: "plus", publicCode: "AB12CD34EF56" },
    token: "token-1",
    loading: false,
    error: null,
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: mockSignOut,
  }),
}));

jest.mock("../src/services/api", () => ({
  sendScanImage: (...args: unknown[]) => mockSendScanImage(...args),
  getMyAlbum: (...args: unknown[]) => mockGetMyAlbum(...args),
  updateMySticker: (...args: unknown[]) => mockUpdateMySticker(...args),
  getFriends: (...args: unknown[]) => mockGetFriends(...args),
  addFriend: (...args: unknown[]) => mockAddFriend(...args),
  sendScanCommit: (...args: unknown[]) => mockSendScanCommit(...args),
  executeTrade: (...args: unknown[]) => mockExecuteTrade(...args),
  tradeCompare: jest.fn().mockResolvedValue({
    status: 200,
    data: {
      otherUser: { username: "carol", publicCode: "ZX98YU76TR54" },
      iCanOffer: [{ code: "BRA2", playerName: "Alisson" }],
      iNeedFromThem: [{ code: "BRA3", playerName: "Bento" }],
    },
  }),
  sendProposal: jest.fn(),
  setAuthToken: jest.fn(),
  login: jest.fn(),
  register: jest.fn(),
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

jest.mock("expo-clipboard", () => ({
  setStringAsync: (...args: unknown[]) => mockSetClipboardString(...args),
}));

jest.mock("expo-camera", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return {
    CameraView: React.forwardRef(
      (props: { active?: boolean }, ref: React.Ref<unknown>) => {
        React.useImperativeHandle(ref, () => ({
          takePictureAsync: mockTakePictureAsync,
        }));

        return (
          <Text>{props.active === false ? "camera-paused" : "camera-active"}</Text>
        );
      },
    ),
    useCameraPermissions: () => [{ granted: true }, jest.fn()],
  };
});

describe("Copa Album mobile app", () => {
  beforeEach(() => {
    mockAsyncStorageState.clear();
    (globalThis as typeof globalThis & { API_BASE?: string }).API_BASE =
      "http://127.0.0.1:3000";

    mockGetMyAlbum.mockReset();
    mockGetMyAlbum.mockResolvedValue({ status: 200, data: baseAlbum });
    mockSignOut.mockReset();
    mockSetClipboardString.mockReset();
    mockSetClipboardString.mockResolvedValue(undefined);

    mockUpdateMySticker.mockReset();
    mockUpdateMySticker.mockImplementation(
      async (code: string, payload: Record<string, unknown>) => ({
        status: 200,
        data: {
          userId: "user-1",
          code,
          owned: payload.owned ?? true,
          duplicateCount:
            payload.duplicateCount ?? payload.duplicateDelta ?? 0,
          updatedAt: new Date().toISOString(),
        },
      }),
    );

    mockGetFriends.mockReset();
    mockGetFriends.mockResolvedValue({
      status: 200,
      data: [],
    });

    mockAddFriend.mockReset();
    mockAddFriend.mockResolvedValue({
        status: 200,
      data: {
        user: { username: "carol", publicCode: "ZX98YU76TR54" },
        ownedCount: 1,
        missingCount: 2,
        duplicates: [],
        album: [],
      },
    });

    mockSendScanCommit.mockReset();
    mockSendScanCommit.mockResolvedValue({
      status: 201,
      data: { applied: [] },
    });

    mockExecuteTrade.mockReset();
    mockExecuteTrade.mockResolvedValue({
      status: 201,
      data: { success: true, received: ["BRA3"], spentDuplicates: ["BRA2"] },
    });

    mockTakePictureAsync.mockReset();
    mockTakePictureAsync.mockResolvedValue({
      base64: "dummy-base64",
      uri: "file://scan.jpg",
      width: 1200,
      height: 1600,
    });

    mockSendScanImage.mockReset();
    mockSendScanImage.mockResolvedValue({
      data: {
        mode: "album-page",
        rawCodes: ["BRA2"],
        items: [
          {
            code: "BRA2",
            playerName: "Alisson",
            team: "Brasil",
            albumPage: 24,
            albumPosition: 2,
            status: "duplicate",
            action: "increment-duplicate",
            confidence: 0.98,
            evidence: ["BRA2"],
            duplicateCount: 0,
          },
        ],
      },
    });
  });

  async function openMenuTab(user: ReturnType<typeof userEvent.setup>, label: string) {
    await user.press(screen.getByRole("tab", { name: "Menu" }));
    await user.press(screen.getByRole("tab", { name: label }));
  }

  it("keeps the search screen empty before the first query", async () => {
    render(<App />);

    await waitFor(() => {
      expect(mockGetMyAlbum).toHaveBeenCalled();
    });

    expect(screen.queryByText("Alisson")).toBeNull();
    expect(screen.queryByText("Bento")).toBeNull();
  });

  it("loads the sharing code from the authenticated user and looks up friends by api", async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(mockGetMyAlbum).toHaveBeenCalled();
    });

    await openMenuTab(user, "Amigos");

    expect(screen.getByText("AB12CD34EF56")).toBeOnTheScreen();

    await user.type(screen.getByLabelText("codigo do amigo"), "zx98yu76tr54");
    await user.press(screen.getByRole("button", { name: "adicionar" }));

    await waitFor(() => {
      expect(mockAddFriend).toHaveBeenCalledWith("ZX98YU76TR54", "token-1");
    });

    expect(screen.getByText(/ZX98YU76TR54/)).toBeOnTheScreen();
    expect(screen.getByText(/foi salvo para comparações de troca/i)).toBeOnTheScreen();

    await waitFor(() => {
      expect(
        screen.queryByText(/foi salvo para comparações de troca/i),
      ).toBeNull();
    }, { timeout: 3000 });
  });

  it("copies sharing codes from my profile and saved friends", async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(mockGetMyAlbum).toHaveBeenCalled();
    });

    await openMenuTab(user, "Amigos");
    await user.press(
      screen.getByRole("button", { name: "copiar meu codigo de compartilhamento" }),
    );

    await waitFor(() => {
      expect(mockSetClipboardString).toHaveBeenCalledWith("AB12CD34EF56");
    });

    await user.type(screen.getByLabelText("codigo do amigo"), "ZX98YU76TR54");
    await user.press(screen.getByRole("button", { name: "adicionar" }));

    await waitFor(() => {
      expect(screen.getByText(/ZX98YU76TR54/)).toBeOnTheScreen();
    });

    await user.press(screen.getByRole("button", { name: "copiar codigo de carol" }));

    await waitFor(() => {
      expect(mockSetClipboardString).toHaveBeenCalledWith("ZX98YU76TR54");
    });
  });

  it("lets the user sign out from the authenticated shell", async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(mockGetMyAlbum).toHaveBeenCalled();
    });

    await user.press(screen.getByRole("button", { name: "sair" }));

    expect(mockSignOut).toHaveBeenCalled();
  });

  it("applies the selected trade directly to my album", async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(mockGetMyAlbum).toHaveBeenCalled();
    });

    await openMenuTab(user, "Amigos");
    await user.type(screen.getByLabelText("codigo do amigo"), "ZX98YU76TR54");
    await user.press(screen.getByRole("button", { name: "adicionar" }));

    await waitFor(() => {
      expect(screen.getByText(/ZX98YU76TR54/)).toBeOnTheScreen();
    });

    await user.press(screen.getByRole("tab", { name: "Trocas" }));
    await user.press(screen.getByRole("button", { name: /carol/i }));
    await waitFor(() => {
      expect(screen.getByText(/Troca com carol/i)).toBeOnTheScreen();
    });

    await user.press(screen.getByRole("button", { name: "Selecionar oferta BRA2" }));
    await user.press(screen.getByRole("button", { name: "Selecionar recebimento BRA3" }));
    await user.press(screen.getByRole("button", { name: "Aplicar no meu album" }));

    await waitFor(() => {
      expect(mockExecuteTrade).toHaveBeenCalledWith(
        {
          toPublicCode: "ZX98YU76TR54",
          offered: ["BRA2"],
          requested: ["BRA3"],
        },
        "token-1",
      );
    });
  });

  it("persists album ownership changes through the api", async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(mockGetMyAlbum).toHaveBeenCalled();
    });

    await user.type(screen.getByRole("search", { name: "pesquisar figurinha" }), "BRA3");
    await user.press(screen.getByRole("button", { name: "alternar BRA3" }));

    await waitFor(() => {
      expect(mockUpdateMySticker).toHaveBeenCalledWith(
        "BRA3",
        expect.objectContaining({ owned: true, duplicateCount: 0 }),
        "token-1",
      );
    });
  });

  it("persists duplicate changes through the api", async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(mockGetMyAlbum).toHaveBeenCalled();
    });

    await user.type(screen.getByRole("search", { name: "pesquisar figurinha" }), "BRA3");
    await user.press(screen.getByRole("button", { name: "Adicionar repetida. Atual: 0" }));

    await waitFor(() => {
      expect(mockUpdateMySticker).toHaveBeenCalledWith(
        "BRA3",
        expect.objectContaining({ owned: true, duplicateDelta: 1 }),
        "token-1",
      );
    });
  });

  it("adds duplicates from the album grid badge too", async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(mockGetMyAlbum).toHaveBeenCalled();
    });

    await user.press(screen.getByRole("tab", { name: "Album" }));
    await user.press(
      screen.getAllByRole("button", { name: "Adicionar repetida. Atual: 0" })[0],
    );

    await waitFor(() => {
      expect(mockUpdateMySticker).toHaveBeenCalledWith(
        "BRA2",
        expect.objectContaining({ owned: true, duplicateDelta: 1 }),
        "token-1",
      );
    });
  });

  it("keeps album browsing button-based without a text filter", async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(mockGetMyAlbum).toHaveBeenCalled();
    });

    await user.press(screen.getByRole("tab", { name: "Album" }));

    expect(screen.queryByLabelText("filtrar album")).toBeNull();
    expect(screen.getByText("Ordenar álbum")).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: "ordenar por Código" }));
    expect(screen.getByText("Marquinhos")).toBeOnTheScreen();
    expect(screen.getByText("Alisson")).toBeOnTheScreen();
  });

  it("lets the user remove a wrong scan result and add a missing sticker before applying the review", async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(mockGetMyAlbum).toHaveBeenCalled();
    });

    await user.press(screen.getByRole("tab", { name: "Scan" }));
    await user.press(screen.getByRole("button", { name: "tirar foto" }));

    await waitFor(() => {
      expect(screen.getByText("Alisson")).toBeOnTheScreen();
    });

    expect(screen.getByText("Alta confiança")).toBeOnTheScreen();

    await user.press(screen.getByRole("button", { name: "remover item BRA2" }));
    expect(screen.queryByText("Alisson")).toBeNull();

    await user.type(screen.getByLabelText("adicionar figurinha na revisao"), "BRA3");
    await user.press(screen.getByRole("button", { name: "adicionar na revisao" }));

    expect(screen.getByText(/Figurinha BRA3 adicionada/i)).toBeOnTheScreen();
    expect(screen.getByText("Bento")).toBeOnTheScreen();

    await user.press(screen.getByRole("button", { name: "aplicar revisao" }));

    await waitFor(() => {
      expect(mockSendScanCommit).toHaveBeenCalled();
    });
  });

  it("pauses the camera while processing and sends code-back mode for verso scans", async () => {
    const user = userEvent.setup();
    let resolveScan:
      | ((value: {
          data: {
            mode: "code-backs";
            rawCodes: string[];
            items: Array<{
              code: string;
              playerName: string;
              team: string;
              albumPage: number;
              albumPosition: number;
              status: string;
              action: string;
              confidence: number;
              evidence: string[];
              duplicateCount: number;
            }>;
          };
        }) => void)
      | undefined;

    mockSendScanImage.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveScan = resolve;
        }),
    );

    render(<App />);

    await waitFor(() => {
      expect(mockGetMyAlbum).toHaveBeenCalled();
    });

    await user.press(screen.getByRole("tab", { name: "Scan" }));
    expect(screen.getByText("camera-active")).toBeOnTheScreen();

    await user.press(screen.getByRole("button", { name: "tirar foto" }));

    expect(screen.getByText("Imagem congelada. Processando leitura...")).toBeOnTheScreen();
    expect(mockSendScanImage).toHaveBeenCalledWith(
      expect.objectContaining({ mode: "code-backs" }),
    );

    resolveScan?.({
      data: {
        mode: "code-backs",
        rawCodes: ["BRA4"],
        items: [
          {
            code: "BRA4",
            playerName: "Marquinhos",
            team: "Brasil",
            albumPage: 24,
            albumPosition: 4,
            status: "new",
            action: "mark-owned",
            confidence: 0.98,
            evidence: ["BRA4"],
            duplicateCount: 0,
          },
        ],
      },
    });

    await waitFor(() => {
      expect(screen.getByText("Marquinhos")).toBeOnTheScreen();
    });
  });
});
