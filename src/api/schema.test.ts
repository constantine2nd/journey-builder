import { describe, expect, it } from "vitest";
import rawGraph from "../test/fixtures/graph.json";
import { InvalidGraphError, parseBlueprintGraph } from "./schema";

describe("parseBlueprintGraph", () => {
  it("parses the mock server's graph.json", () => {
    const graph = parseBlueprintGraph(rawGraph);

    expect(graph.name).toBe("Onboard Customer 0");
    expect(graph.nodes.map((node) => node.data.name).sort()).toEqual([
      "Form A",
      "Form B",
      "Form C",
      "Form D",
      "Form E",
      "Form F",
    ]);
    expect(graph.edges).toHaveLength(6);
    expect(graph.forms.map((form) => Object.keys(form.field_schema.properties))).toEqual(
      Array<string[]>(3).fill([
        "button",
        "dynamic_checkbox_group",
        "dynamic_object",
        "email",
        "id",
        "multi_select",
        "name",
        "notes",
      ]),
    );
  });

  it("reads the real API's null arrays as empty", () => {
    const graph = parseBlueprintGraph({
      ...rawGraph,
      edges: null,
      forms: null,
      nodes: [
        {
          ...rawGraph.nodes[0],
          data: { ...rawGraph.nodes[0]?.data, prerequisites: null },
        },
      ],
    });

    expect(graph.edges).toEqual([]);
    expect(graph.forms).toEqual([]);
    expect(graph.nodes[0]?.data.prerequisites).toEqual([]);
  });

  it("keeps node types the app does not know", () => {
    const graph = parseBlueprintGraph({
      ...rawGraph,
      nodes: [{ ...rawGraph.nodes[0], type: "statusGate" }],
    });
    expect(graph.nodes[0]?.type).toBe("statusGate");
  });

  it("passes unknown fields through rather than rejecting them", () => {
    const graph = parseBlueprintGraph({ ...rawGraph, promoted_data_order: ["x"] });
    expect(graph).toHaveProperty("promoted_data_order", ["x"]);
  });

  it("names the path that is wrong", () => {
    const broken = { ...rawGraph, nodes: [{ ...rawGraph.nodes[0], id: 42 }] };

    expect(() => parseBlueprintGraph(broken)).toThrow(InvalidGraphError);
    expect(() => parseBlueprintGraph(broken)).toThrow(
      "The server's response is not a blueprint graph at nodes.0.id",
    );
  });

  it("rejects a response that is not an object", () => {
    expect(() => parseBlueprintGraph("<html>")).toThrow(InvalidGraphError);
  });
});
