import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildScanReview,
  CatalogSticker,
  getReadablePlayerName,
  normalizeStickerCode,
  normalizeText,
  ScanMode,
  ScanReview,
  ScanReviewItem,
  searchCatalog,
  UserStickerState,
} from "@copa/shared";
import { AppTab } from "../constants/tabs";
import { AuthUser } from "./useAuth";
import {
  addFriend,
  getFriends,
  getMyAlbum,
  sendScanCommit,
  updateMySticker,
} from "../services/api";
import { parseSearchInput } from "../utils/helpers";

export type AlbumSticker = CatalogSticker & UserStickerState;

export type FriendProfile = {
  user: {
    username: string;
    publicCode: string;
  };
  ownedCount: number;
  missingCount: number;
  duplicates: AlbumSticker[];
  album: AlbumSticker[];
};

function normalizeAlbum(data: unknown): AlbumSticker[] {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((item) => {
    const sticker = item as Partial<AlbumSticker>;
    const aliases = Array.isArray(sticker.aliases)
      ? sticker.aliases.map((alias) => String(alias))
      : [];
    return {
      code: String(sticker.code ?? ""),
      playerName: getReadablePlayerName(String(sticker.playerName ?? ""), aliases),
      team: String(sticker.team ?? ""),
      albumPage: Number(sticker.albumPage ?? 0),
      albumPosition: Number(sticker.albumPosition ?? 0),
      aliases,
      owned: Boolean(sticker.owned),
      duplicateCount: Number(sticker.duplicateCount ?? 0),
    };
  });
}

function normalizeFriendProfile(data: unknown): FriendProfile | null {
  const profile = data as Partial<FriendProfile> | null;
  if (!profile?.user?.publicCode || !profile.user.username) {
    return null;
  }

  return {
    user: {
      username: String(profile.user.username),
      publicCode: String(profile.user.publicCode),
    },
    ownedCount: Number(profile.ownedCount ?? 0),
    missingCount: Number(profile.missingCount ?? 0),
    duplicates: normalizeAlbum(profile.duplicates),
    album: normalizeAlbum(profile.album),
  };
}

export function useAlbumApp(user: AuthUser | null, token?: string | null) {
  const userId = user?.id ?? null;
  const [tab, setTab] = useState<AppTab>("search");
  const [query, setQuery] = useState("");
  const [album, setAlbum] = useState<AlbumSticker[]>([]);
  const [albumLoading, setAlbumLoading] = useState(false);
  const [scanMode, setScanMode] = useState<ScanMode>("code-backs");
  const [rawText, setRawText] = useState("BRA2 BRA3");
  const [review, setReview] = useState<ScanReview | undefined>();
  const [reviewManualInput, setReviewManualInput] = useState("");
  const [reviewEditMessage, setReviewEditMessage] = useState("");
  const [reviewEditTone, setReviewEditTone] = useState<"info" | "success" | "error">("info");
  const [addedFriends, setAddedFriends] = useState<FriendProfile[]>([]);
  const [friendLookupMessage, setFriendLookupMessage] = useState("");
  const [friendLookupTone, setFriendLookupTone] = useState<"info" | "success" | "error">("info");

  const states = useMemo<UserStickerState[]>(
    () =>
      album.map((sticker) => ({
        code: sticker.code,
        owned: sticker.owned,
        duplicateCount: sticker.duplicateCount,
      })),
    [album],
  );

  const normalizedQuery = query.trim();
  const searchResults = useMemo(() => {
    if (!normalizedQuery) {
      return [];
    }
    return searchCatalog(album, parseSearchInput(query)).slice(0, 24);
  }, [album, normalizedQuery, query]);

  const refreshAlbum = useCallback(async () => {
    if (!userId || !token) {
      setAlbum([]);
      return;
    }

    setAlbumLoading(true);
    try {
      const response = await getMyAlbum(token);
      if (response.status === 200) {
        setAlbum(normalizeAlbum(response.data));
      }
    } finally {
      setAlbumLoading(false);
    }
  }, [token, userId]);

  useEffect(() => {
    void refreshAlbum();
  }, [refreshAlbum]);

  useEffect(() => {
    if (!userId) {
      setAddedFriends([]);
      return;
    }

    (async () => {
      try {
        const response = await getFriends(token ?? undefined);
        if ((response.status !== 200 && response.status !== 201) || !Array.isArray(response.data)) {
          return;
        }

        const restored = response.data
          .map((item: unknown) => normalizeFriendProfile(item))
          .filter(Boolean) as FriendProfile[];
        setAddedFriends(restored);
      } catch (error) {
        console.warn("useAlbumApp: failed to load saved friends", error);
      }
    })();
  }, [token, userId]);

  useEffect(() => {
    if (!friendLookupMessage) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setFriendLookupMessage("");
      setFriendLookupTone("info");
    }, 1800);

    return () => clearTimeout(timeoutId);
  }, [friendLookupMessage]);

  const upsertAlbumSticker = useCallback(
    (code: string, change: Partial<AlbumSticker>) => {
      setAlbum((currentAlbum) => {
        const existing = currentAlbum.find((item) => item.code === code);
        if (!existing) {
          return currentAlbum;
        }

        return currentAlbum.map((item) =>
          item.code === code ? { ...item, ...change } : item,
        );
      });
    },
    [],
  );

  async function toggleSticker(code: string) {
    const current = album.find((item) => item.code === code);
    if (!current || !token) {
      return;
    }

    const nextOwned = !current.owned;
    const nextDuplicateCount = nextOwned ? current.duplicateCount : 0;

    const response = await updateMySticker(
      code,
      { owned: nextOwned, duplicateCount: nextDuplicateCount },
      token,
    );

    if (response.status === 200) {
      upsertAlbumSticker(code, {
        owned: nextOwned,
        duplicateCount: nextDuplicateCount,
      });
    }
  }

  async function addDuplicate(code: string) {
    const current = album.find((item) => item.code === code);
    if (!current || !token) {
      return;
    }

    const response = await updateMySticker(
      code,
      { owned: true, duplicateDelta: 1 },
      token,
    );

    if (response.status === 200) {
      upsertAlbumSticker(code, {
        owned: true,
        duplicateCount: current.duplicateCount + 1,
      });
    }
  }

  function runReview() {
    setReviewManualInput("");
    setReviewEditMessage("");
    setReviewEditTone("info");
    setReview(buildScanReview({ mode: scanMode, rawText }, album, states));
  }

  function applyServerReview(serverReview: ScanReview) {
    setReviewManualInput("");
    setReviewEditMessage("");
    setReviewEditTone("info");
    setReview(serverReview);
  }

  function buildManualReviewItem(sticker: CatalogSticker): ScanReviewItem {
    const current = album.find((item) => item.code === sticker.code);
    const playerName = getReadablePlayerName(sticker.playerName, sticker.aliases);

    if (current?.owned) {
      return {
        code: sticker.code,
        playerName,
        team: sticker.team,
        albumPage: sticker.albumPage,
        albumPosition: sticker.albumPosition,
        status: "duplicate",
        action: "increment-duplicate",
        confidence: 1,
        evidence: ["ajuste manual"],
        duplicateCount: current.duplicateCount,
      };
    }

    return {
      code: sticker.code,
      playerName,
      team: sticker.team,
      albumPage: sticker.albumPage,
      albumPosition: sticker.albumPosition,
      status: "new",
      action: "mark-owned",
      confidence: 1,
      evidence: ["ajuste manual"],
      duplicateCount: current?.duplicateCount ?? 0,
    };
  }

  function removeReviewItem(index: number) {
    setReview((currentReview) => {
      if (!currentReview) {
        return currentReview;
      }

      return {
        ...currentReview,
        items: currentReview.items.filter((_, itemIndex) => itemIndex !== index),
      };
    });

    setReviewEditTone("info");
    setReviewEditMessage("Item removido da revisao.");
  }

  function addReviewItemManually() {
    const trimmedInput = reviewManualInput.trim();
    if (!trimmedInput || !review) {
      setReviewEditTone("error");
      setReviewEditMessage("Digite um codigo ou nome para adicionar na revisao.");
      return;
    }

    const matches = searchCatalog(album, { query: trimmedInput });
    const normalizedInput = normalizeText(trimmedInput);
    const normalizedCodeInput = normalizeStickerCode(trimmedInput);
    const sticker =
      matches.find((item) => item.code === normalizedCodeInput) ??
      matches.find(
        (item) =>
          normalizeText(item.playerName) === normalizedInput ||
          item.aliases.some((alias) => normalizeText(alias) === normalizedInput),
      ) ??
      matches[0];

    if (!sticker) {
      setReviewEditTone("error");
      setReviewEditMessage("Nao encontrei essa figurinha no catalogo.");
      return;
    }

    if (review.items.some((item) => item.code === sticker.code)) {
      setReviewEditTone("error");
      setReviewEditMessage(`A figurinha ${sticker.code} ja esta na revisao.`);
      return;
    }

    setReview((currentReview) => {
      if (!currentReview) {
        return currentReview;
      }

      return {
        ...currentReview,
        items: [...currentReview.items, buildManualReviewItem(sticker)],
      };
    });

    setReviewManualInput("");
    setReviewEditTone("success");
    setReviewEditMessage(`Figurinha ${sticker.code} adicionada na revisao.`);
  }

  async function applyReview() {
    if (!review || !token) {
      return;
    }

    const items = review.items
      .filter((item) => item.code)
      .map((item) => ({
        code: item.code as string,
        action: item.action,
      }));

    const response = await sendScanCommit({ items }, token);
    if (response.status === 200 || response.status === 201) {
      await refreshAlbum();
      setReviewManualInput("");
      setReviewEditMessage("");
      setReviewEditTone("info");
      setReview(undefined);
      setTab("album");
    }
  }

  async function handleAddFriend(identifier: string) {
    const normalizedIdentifier = identifier.trim();
    if (!normalizedIdentifier) {
      setFriendLookupTone("error");
      setFriendLookupMessage("Digite o código de compartilhamento ou o usuário do amigo.");
      return false;
    }

    const response = await addFriend(normalizedIdentifier, token ?? undefined);
    if (response.status !== 200 && response.status !== 201) {
      setFriendLookupTone("error");
      setFriendLookupMessage(
        response.data?.message ||
          "Não encontrei esse amigo. Confira o código e tente de novo.",
      );
      return false;
    }

    const profile = normalizeFriendProfile(response.data);
    if (!profile) {
      setFriendLookupTone("error");
      setFriendLookupMessage("Não consegui carregar os dados desse amigo agora.");
      return false;
    }

    const alreadyAdded = addedFriends.some(
      (friend) => friend.user.publicCode === profile.user.publicCode,
    );

    setAddedFriends((currentFriends) => {
      if (alreadyAdded) {
        return currentFriends;
      }

      return [...currentFriends, profile];
    });

    setFriendLookupTone(alreadyAdded ? "info" : "success");
    setFriendLookupMessage(
      alreadyAdded
        ? `${profile.user.username} já está salvo na sua lista de trocas.`
        : `${profile.user.username} foi salvo para comparações de troca.`,
    );
    return true;
  }

  return {
    tab,
    setTab,
    query,
    setQuery,
    album,
    albumLoading,
    states,
    scanMode,
    setScanMode,
    rawText,
    setRawText,
    review,
    reviewManualInput,
    reviewEditMessage,
    reviewEditTone,
    searchResults,
    addedFriends,
    myPublicCode: user?.publicCode ?? "",
    friendLookupMessage,
    friendLookupTone,
    refreshAlbum,
    toggleSticker,
    addDuplicate,
    runReview,
    applyReview,
    applyServerReview,
    setReviewManualInput,
    removeReviewItem,
    addReviewItemManually,
    handleAddFriend,
  };
}
