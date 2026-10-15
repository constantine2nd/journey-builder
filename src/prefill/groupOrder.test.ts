import { describe, expect, it } from "vitest";
import { orderGroups } from "./groupOrder";
import type { SourcedGroup } from "./source";

const group = (sourceId: string, label: string): SourcedGroup => ({
  sourceId,
  key: `${sourceId}/${label}`,
  id: label,
  label,
  elements: [],
});

const groups = [
  group("direct_dependencies", "Form B"),
  group("transitive_dependencies", "Form A"),
  group("global_data", "Action Properties"),
  group("global_data", "Client Organisation Properties"),
];

describe("orderGroups", () => {
  it("is alphabetical by label by default, as in the reference", () => {
    expect(orderGroups(groups).map((g) => g.label)).toEqual([
      "Action Properties",
      "Client Organisation Properties",
      "Form A",
      "Form B",
    ]);
  });

  it("can keep the source order instead", () => {
    expect(orderGroups(groups, "source").map((g) => g.label)).toEqual([
      "Form B",
      "Form A",
      "Action Properties",
      "Client Organisation Properties",
    ]);
  });

  it("does not mutate its input", () => {
    const copy = [...groups];
    orderGroups(groups);
    expect(groups).toEqual(copy);
  });
});
