import { describe, expect, it } from "vitest";
import { buildGraph, mockGraph } from "../test/builders";
import { fromExpression, stateFromGraph, toExpression } from "./expressions";
import type { DataReference } from "./model";
import { EMPTY_STATE } from "./state";

const references: DataReference[] = [
  { kind: "form_field", nodeId: "a", field: "email" },
  { kind: "form_meta", nodeId: "a", property: "completed_at" },
  { kind: "global", group: "clientOrg", key: "name" },
];

describe("toExpression / fromExpression", () => {
  it.each(references)("round-trips %o", (reference) => {
    expect(fromExpression(toExpression(reference))).toEqual(reference);
  });

  it("uses the API's { type, value } vocabulary", () => {
    expect(toExpression({ kind: "form_field", nodeId: "a", field: "email" })).toEqual({
      type: "form_field",
      value: { nodeId: "a", field: "email" },
    });
  });

  it("reads any { type, value: strings } shape, so a new kind round-trips", () => {
    expect(fromExpression({ type: "tenant_setting", value: { key: "locale" } })).toEqual({
      kind: "tenant_setting",
      key: "locale",
    });
  });

  it("reads nothing into other shapes", () => {
    expect(fromExpression(undefined)).toBeUndefined();
    expect(fromExpression("email")).toBeUndefined();
    expect(fromExpression({ type: "jsonata", value: "$.email" })).toBeUndefined();
    expect(fromExpression({ value: { field: "email" } })).toBeUndefined();
    expect(fromExpression({ type: "form_field", value: { depth: 2 } })).toBeUndefined();
    expect(fromExpression({ type: "form_field", value: ["a"] })).toBeUndefined();
  });
});

describe("stateFromGraph", () => {
  it("is empty for the mock, whose input_mappings are all {}", () => {
    expect(stateFromGraph(mockGraph)).toBe(EMPTY_STATE);
  });

  it("hydrates the mappings it can read and skips the rest", () => {
    const graph = buildGraph([
      { id: "a" },
      {
        id: "d",
        prerequisites: ["a"],
        input_mapping: {
          email: toExpression({ kind: "form_field", nodeId: "a", field: "email" }),
          notes: { type: "jsonata", value: "$.notes" },
        },
      },
    ]);

    expect(stateFromGraph(graph)).toEqual({
      d: {
        enabled: true,
        mappings: { email: { kind: "form_field", nodeId: "a", field: "email" } },
      },
    });
  });
});
