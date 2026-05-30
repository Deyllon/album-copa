export type AppTab = "search" | "album" | "duplicates" | "scan" | "trades" | "friends";

export const appTabs: Array<{ id: AppTab; label: string }> = [
  { id: "search", label: "Buscar" },
  { id: "album", label: "Album" },
  { id: "duplicates", label: "Repetidas" },
  { id: "scan", label: "Scan" },
  { id: "trades", label: "Trocas" },
  { id: "friends", label: "Amigos" },
];
