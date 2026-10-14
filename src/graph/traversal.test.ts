import { describe, expect, it } from "vitest";
import { buildGraph, mockGraph, NODE } from "../test/builders";
import { indexGraph } from "./graphIndex";
import { ancestorIds, directDependencyIds, transitiveDependencyIds } from "./traversal";

const names = (ids: string[]) =>
  ids.map((id) => mockGraph.nodes.find((node) => node.id === id)?.data.name);

describe("on the mock graph (A → B → D, A → C → E, (D, E) → F)", () => {
  const index = indexGraph(mockGraph);

  it("Form D depends directly on B and transitively on A", () => {
    expect(names(directDependencyIds(index, NODE["Form D"]!))).toEqual(["Form B"]);
    expect(names(transitiveDependencyIds(index, NODE["Form D"]!))).toEqual(["Form A"]);
  });

  it("Form A, the root, depends on nothing", () => {
    expect(ancestorIds(index, NODE["Form A"]!)).toEqual([]);
  });

  it("Form F sees every ancestor once, nearest first (a diamond on A)", () => {
    expect(names(ancestorIds(index, NODE["Form F"]!))).toEqual([
      "Form D",
      "Form E",
      "Form B",
      "Form C",
      "Form A",
    ]);
    expect(names(transitiveDependencyIds(index, NODE["Form F"]!))).toEqual([
      "Form B",
      "Form C",
      "Form A",
    ]);
  });
});

describe("edge cases", () => {
  it("a node reachable both directly and through a path counts as direct only", () => {
    const graph = buildGraph([
      { id: "a" },
      { id: "b", prerequisites: ["a"] },
      { id: "d", prerequisites: ["b", "a"] },
    ]);
    const index = indexGraph(graph);
    expect(directDependencyIds(index, "d")).toEqual(["b", "a"]);
    expect(transitiveDependencyIds(index, "d")).toEqual([]);
  });

  it("a non-form node in the path keeps the forms behind it reachable", () => {
    const graph = buildGraph([
      { id: "a" },
      { id: "gate", type: "statusGate", prerequisites: ["a"] },
      { id: "d", prerequisites: ["gate"] },
    ]);
    const index = indexGraph(graph);
    expect(directDependencyIds(index, "d")).toEqual(["gate"]);
    expect(transitiveDependencyIds(index, "d")).toEqual(["a"]);
  });

  it("terminates on a cycle and never lists the node itself", () => {
    const graph = buildGraph([
      { id: "a", prerequisites: ["b"] },
      { id: "b", prerequisites: ["a"] },
    ]);
    expect(ancestorIds(indexGraph(graph), "a")).toEqual(["b"]);
  });

  it("is empty for an unknown node", () => {
    expect(ancestorIds(indexGraph(mockGraph), "nope")).toEqual([]);
  });
});
