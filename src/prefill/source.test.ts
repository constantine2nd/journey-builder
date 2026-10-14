import { describe, expect, it } from "vitest";
import { indexGraph } from "../graph";
import { mockGraph, NODE } from "../test/builders";
import type { DataReference } from "./model";
import { describeReference, type DataSource, type SourceContext } from "./source";

const index = indexGraph(mockGraph);
const context: SourceContext = {
  index,
  targetNode: index.nodesById.get(NODE["Form D"]!)!,
};

/** A source that only knows global references in one group. */
function globalSource(group: string): DataSource {
  return {
    id: `globals_${group}`,
    label: group,
    getGroups: () => [],
    describe: (reference) =>
      reference.kind === "global" && reference.group === group
        ? `${group}.${reference.key}`
        : undefined,
  };
}

describe("describeReference", () => {
  const reference: DataReference = { kind: "global", group: "action", key: "id" };

  it("uses the first source that recognises the reference", () => {
    expect(
      describeReference(
        [globalSource("clientOrg"), globalSource("action")],
        reference,
        context,
      ),
    ).toBe("action.id");
  });

  it("falls back to a readable label when no source recognises it", () => {
    expect(describeReference([globalSource("clientOrg")], reference, context)).toBe(
      "(unavailable: global)",
    );
    expect(describeReference([], reference, context)).toBe("(unavailable: global)");
  });
});
