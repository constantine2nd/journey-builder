import type { SourcedGroup } from "./source";

/**
 * How the picker orders groups (decision D5). The reference shows
 * "Action Properties, Client Organisation Properties, Form A, Form B":
 * alphabetical by label, regardless of which source produced them.
 * "source" keeps the configured source order instead.
 */
export type GroupOrder = "alphabetical" | "source";

export const DEFAULT_GROUP_ORDER: GroupOrder = "alphabetical";

export function orderGroups(
  groups: readonly SourcedGroup[],
  order: GroupOrder = DEFAULT_GROUP_ORDER,
): SourcedGroup[] {
  if (order === "source") return [...groups];
  return [...groups].sort((a, b) => a.label.localeCompare(b.label));
}
