import type { BlueprintGraph, FormDefinition, GraphNode } from "../api/schema";
import { parseBlueprintGraph } from "../api/schema";
import rawGraph from "./fixtures/graph.json";

/** The mock server's graph, parsed. DAG: A → B → D, A → C → E, (D, E) → F. */
export const mockGraph: BlueprintGraph = parseBlueprintGraph(rawGraph);

/** Node ids of the mock graph by form name, e.g. NODE["Form D"]. */
export const NODE: Readonly<Record<string, string>> = Object.fromEntries(
  mockGraph.nodes.map((node) => [node.data.name, node.id]),
);

/** Every mock form has these fields; "button" is an action, not data. */
export const MOCK_FIELDS = [
  "button",
  "dynamic_checkbox_group",
  "dynamic_object",
  "email",
  "id",
  "multi_select",
  "name",
  "notes",
] as const;

interface NodeSpec {
  id: string;
  name?: string;
  type?: string;
  prerequisites?: string[];
  /** Defaults to the single shared form definition. */
  formId?: string;
  input_mapping?: Record<string, unknown>;
}

export const DEFAULT_FORM_ID = "form_default";

/**
 * A small graph for edge cases the mock does not cover. Every node is a
 * form on the default definition unless the spec says otherwise.
 */
export function buildGraph(
  nodes: readonly NodeSpec[],
  forms: readonly FormDefinition[] = [buildForm(DEFAULT_FORM_ID)],
): BlueprintGraph {
  const graphNodes: GraphNode[] = nodes.map((spec) => ({
    id: spec.id,
    type: spec.type ?? "form",
    data: {
      id: `bp_c_${spec.id}`,
      component_key: spec.id,
      component_type: spec.type ?? "form",
      component_id: spec.formId ?? DEFAULT_FORM_ID,
      name: spec.name ?? spec.id,
      prerequisites: spec.prerequisites ?? [],
      input_mapping: spec.input_mapping ?? {},
    },
  }));

  return parseBlueprintGraph({
    id: "bp_test",
    tenant_id: "1",
    name: "Test blueprint",
    nodes: graphNodes,
    edges: graphNodes.flatMap((node) =>
      node.data.prerequisites.map((source) => ({ source, target: node.id })),
    ),
    forms,
  });
}

export function buildForm(
  id: string,
  fields: readonly string[] = ["email", "name"],
): FormDefinition {
  return {
    id,
    name: `Form definition ${id}`,
    field_schema: {
      type: "object",
      properties: Object.fromEntries(
        fields.map((field) => [
          field,
          { avantos_type: field === "button" ? "button" : "short-text", type: "string" },
        ]),
      ),
      required: [],
    },
  };
}
