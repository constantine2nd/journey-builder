import { describe, expect, it } from "vitest";
import { indexGraph } from "../graph";
import { mockGraph, NODE } from "../test/builders";
import { resolveSources } from "./config";
import { collectGroups, type SourceContext } from "./source";

/**
 * The brief, in bold: "any combination of these data sources can be easily
 * used without code changes". For every non-empty combination of the three
 * sources, Form D must get exactly the groups those sources contribute, in
 * the configured order.
 */
const GROUPS_FOR_FORM_D: Record<string, string[]> = {
  direct_dependencies: ["Form B"],
  transitive_dependencies: ["Form A"],
  global_data: ["Action Properties", "Client Organisation Properties"],
};

const SOURCE_IDS = Object.keys(GROUPS_FOR_FORM_D);

/** All non-empty subsets, in registry order. */
const combinations = Array.from({ length: 2 ** SOURCE_IDS.length - 1 }, (_, i) =>
  SOURCE_IDS.filter((_, bit) => (i + 1) & (1 << bit)),
);

const index = indexGraph(mockGraph);
const context: SourceContext = {
  index,
  targetNode: index.nodesById.get(NODE["Form D"]!)!,
};

const groupLabels = (sourceIds: string[]) =>
  collectGroups(resolveSources(sourceIds), context).map((group) => group.label);

describe("any combination of data sources", () => {
  it("covers all 7 non-empty combinations", () => {
    expect(combinations).toHaveLength(7);
  });

  it.each(combinations.map((ids) => [ids.join(" + "), ids] as const))(
    "%s",
    (_, sourceIds) => {
      expect(groupLabels(sourceIds)).toEqual(
        sourceIds.flatMap((id) => GROUPS_FOR_FORM_D[id]),
      );
    },
  );

  it("follows the configured order, not the registry order", () => {
    expect(
      groupLabels(["global_data", "transitive_dependencies", "direct_dependencies"]),
    ).toEqual([
      "Action Properties",
      "Client Organisation Properties",
      "Form A",
      "Form B",
    ]);
  });

  it("tags every group with its source and a key unique across sources", () => {
    const groups = collectGroups(resolveSources(SOURCE_IDS), context);
    expect(groups.map((group) => group.sourceId)).toEqual([
      "direct_dependencies",
      "transitive_dependencies",
      "global_data",
      "global_data",
    ]);
    expect(new Set(groups.map((group) => group.key)).size).toBe(groups.length);
  });
});
