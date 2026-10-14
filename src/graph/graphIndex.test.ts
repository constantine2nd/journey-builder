import { describe, expect, it } from "vitest";
import { buildGraph, mockGraph, NODE } from "../test/builders";
import { formOf, indexGraph, prerequisitesOf } from "./graphIndex";

describe("indexGraph", () => {
  const index = indexGraph(mockGraph);

  it("indexes nodes and forms by id", () => {
    expect(index.nodesById.get(NODE["Form D"]!)?.data.name).toBe("Form D");
    expect(index.formsById.size).toBe(3);
  });

  it("lists only form nodes, in API order", () => {
    const graph = buildGraph([
      { id: "a" },
      { id: "gate", type: "statusGate", prerequisites: ["a"] },
      { id: "b", prerequisites: ["gate"] },
    ]);
    expect(indexGraph(graph).formNodes.map((node) => node.id)).toEqual(["a", "b"]);
  });
});

describe("formOf", () => {
  it("resolves a form node to its definition", () => {
    const index = indexGraph(mockGraph);
    const formD = index.nodesById.get(NODE["Form D"]!)!;
    expect(formOf(index, formD)?.id).toBe(formD.data.component_id);
  });

  it("is undefined for a non-form node or a missing definition", () => {
    const graph = buildGraph([
      { id: "gate", type: "statusGate" },
      { id: "orphan", formId: "does_not_exist" },
    ]);
    const index = indexGraph(graph);
    expect(formOf(index, index.nodesById.get("gate")!)).toBeUndefined();
    expect(formOf(index, index.nodesById.get("orphan")!)).toBeUndefined();
  });
});

describe("prerequisitesOf", () => {
  it("drops ids that are not in the graph and repeats", () => {
    const graph = buildGraph([
      { id: "a" },
      { id: "b", prerequisites: ["a", "ghost", "a"] },
    ]);
    expect(prerequisitesOf(indexGraph(graph), "b")).toEqual(["a"]);
  });

  it("is empty for an unknown node", () => {
    expect(prerequisitesOf(indexGraph(mockGraph), "nope")).toEqual([]);
  });
});
