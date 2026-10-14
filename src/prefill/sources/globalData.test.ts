import { describe, expect, it } from "vitest";
import { indexGraph } from "../../graph";
import { mockGraph, NODE } from "../../test/builders";
import type { SourceContext } from "../source";
import { globalDataSource } from "./globalData";

const index = indexGraph(mockGraph);
const context: SourceContext = {
  index,
  targetNode: index.nodesById.get(NODE["Form D"]!)!,
};

describe("globalDataSource", () => {
  it("offers the same two groups for any form", () => {
    const groups = globalDataSource.getGroups(context);
    expect(groups.map((group) => group.label)).toEqual([
      "Action Properties",
      "Client Organisation Properties",
    ]);
    expect(groups[0]?.elements.map((element) => element.label)).toEqual([
      "id",
      "name",
      "status",
      "created_at",
      "initiator_email",
    ]);
    expect(groups[1]?.elements[1]?.reference).toEqual({
      kind: "global",
      group: "clientOrg",
      key: "name",
    });
  });

  it("describes its references with a short group name", () => {
    expect(
      globalDataSource.describe(
        { kind: "global", group: "clientOrg", key: "name" },
        context,
      ),
    ).toBe("Client Organisation.name");
    expect(
      globalDataSource.describe(
        { kind: "global", group: "action", key: "status" },
        context,
      ),
    ).toBe("Action.status");
  });

  it("does not describe unknown groups, keys or other kinds", () => {
    expect(
      globalDataSource.describe({ kind: "global", group: "tenant", key: "id" }, context),
    ).toBeUndefined();
    expect(
      globalDataSource.describe(
        { kind: "global", group: "action", key: "nope" },
        context,
      ),
    ).toBeUndefined();
    expect(
      globalDataSource.describe(
        { kind: "form_field", nodeId: NODE["Form A"]!, field: "email" },
        context,
      ),
    ).toBeUndefined();
  });
});
