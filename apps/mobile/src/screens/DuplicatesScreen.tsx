import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { StickerSquare } from "../components/StickerSquare";
import { AlbumSticker } from "../hooks/useAlbumApp";
import { EmptyState } from "./EmptyState";

export function DuplicatesScreen({
  album,
  addDuplicate,
}: {
  album: AlbumSticker[];
  addDuplicate: (code: string) => Promise<void>;
}) {
  const duplicates = useMemo(() => {
    return album.filter((sticker) => sticker.duplicateCount > 0);
  }, [album]);

  return (
    <View style={styles.grid}>
      {duplicates.length === 0 ? (
        <EmptyState
          title="Nenhuma repetida por enquanto"
          description="Quando uma figurinha repetir, ela aparece aqui pronta para troca."
        />
      ) : null}
      {duplicates.map((sticker) => (
        <StickerSquare
          key={sticker.code}
          sticker={sticker}
          state={sticker}
          onToggle={() => {}}
          onDuplicate={() => addDuplicate(sticker.code)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
