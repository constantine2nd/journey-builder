import { describe, expect, it } from "vitest";
import { indexGraph } from "../../graph";
import { buildGraph, MOCK_FIELDS, mockGraph, NODE } from "../../test/builders";
import type { SourceContext } from "../source";
import { directDependenciesSource, transitiveDependenciesSource } from "./formSources";

const index = indexGraph(mockGraph);
const contextFor = (name: string): SourceContext => ({
  index,
  targetNode: index.nodesById.get(NODE[name]!)!,
});

describe("directDependenciesSource", () => {
  it("offers Form B for Form D: completed_at, then every field including button", () => {
    const groups = directDependenciesSource.getGroups(contextFor("Form D"));

    expect(groups.map((group) => [group.label, group.badge])).toEqual([
      ["Form B", "direct"],
    ]);
    expect(groups[0]?.elements.map((element) => element.label)).toEqual([
      "completed_at",
      ...MOCK_FIELDS,
    ]);
    expect(groups[0]?.elements[0]?.reference).toEqual({
      kind: "form_meta",
      nodeId: NODE["Form B"],
      property: "completed_at",
    });
    expect(groups[0]?.elements[4]?.reference).toEqual({
      kind: "form_field",
      nodeId: NODE["Form B"],
      field: "email",
    });
  });

  it("offers both prerequisites of Form F, and nothing for the root", () => {
    expect(
      directDependenciesSource
        .getGroups(contextFor("Form F"))
        .map((group) => group.label),
    ).toEqual(["Form D", "Form E"]);
    expect(directDependenciesSource.getGroups(contextFor("Form A"))).toEqual([]);
  });

  it("skips a prerequisite that is not a form", () => {
    const graph = buildGraph([
      { id: "a" },
      { id: "gate", type: "statusGate", prerequisites: ["a"] },
      { id: "d", prerequisites: ["gate"] },
    ]);
    const gateIndex = indexGraph(graph);
    const context: SourceContext = {
      index: gateIndex,
      targetNode: gateIndex.nodesById.get("d")!,
    };
    expect(directDependenciesSource.getGroups(context)).toEqual([]);
    expect(
      transitiveDependenciesSource.getGroups(context).map((group) => group.label),
    ).toEqual(["a"]);
  });

  it("describes its own references as Form.element", () => {
    const context = contextFor("Form D");
    expect(
      directDependenciesSource.describe(
        { kind: "form_field", nodeId: NODE["Form B"]!, field: "email" },
        context,
      ),
    ).toBe("Form B.email");
    expect(
      directDependenciesSource.describe(
        { kind: "form_meta", nodeId: NODE["Form B"]!, property: "completed_at" },
        context,
      ),
    ).toBe("Form B.completed_at");
  });

  it("does not describe references to forms it does not offer", () => {
    const context = contextFor("Form D");
    // Form A is transitive for D, not direct.
    expect(
      directDependenciesSource.describe(
        { kind: "form_field", nodeId: NODE["Form A"]!, field: "email" },
        context,
      ),
    ).toBeUndefined();
    expect(
      directDependenciesSource.describe(
        { kind: "global", group: "action", key: "id" },
        context,
      ),
    ).toBeUndefined();
  });
});

describe("transitiveDependenciesSource", () => {
  it("offers Form A for Form D and B, C, A for Form F, nearest first", () => {
    expect(
      transitiveDependenciesSource
        .getGroups(contextFor("Form D"))
        .map((g) => [g.label, g.badge]),
    ).toEqual([["Form A", "transitive"]]);
    expect(
      transitiveDependenciesSource.getGroups(contextFor("Form F")).map((g) => g.label),
    ).toEqual(["Form B", "Form C", "Form A"]);
  });

  it("offers nothing for Form B, whose only ancestor is direct", () => {
    expect(transitiveDependenciesSource.getGroups(contextFor("Form B"))).toEqual([]);
  });

  it("describes Form A's email for Form D", () => {
    expect(
      transitiveDependenciesSource.describe(
        { kind: "form_field", nodeId: NODE["Form A"]!, field: "email" },
        contextFor("Form D"),
      ),
    ).toBe("Form A.email");
  });
});
