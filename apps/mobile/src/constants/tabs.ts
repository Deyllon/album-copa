export type AppTab =
  | "search"
  | "album"
  | "duplicates"
  | "missing"
  | "completed"
  | "lists"
  | "scan"
  | "trades"
  | "friends";

export const appTabs: Array<{ id: AppTab; label: string }> = [
  { id: "search", label: "Buscar" },
  { id: "album", label: "Album" },
  { id: "duplicates", label: "Repetidas" },
  { id: "missing", label: "Faltantes" },
  { id: "completed", label: "Completas" },
  { id: "lists", label: "Listas" },
  { id: "scan", label: "Scan" },
  { id: "trades", label: "Trocas" },
  { id: "friends", label: "Amigos" },
];
