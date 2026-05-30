import { CatalogSearchInput } from "@copa/shared";

export function parseSearchInput(value: string): CatalogSearchInput {
  return { query: value };
}
