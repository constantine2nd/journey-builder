import type { BlueprintGraph, FormDefinition, GraphNode } from "../api/schema";

/**
 * The graph, indexed once for the lookups the app makes repeatedly:
 * node by id, form definition by id, and which nodes are forms (decision D8).
 * Built from a parsed BlueprintGraph; never mutated.
 */
export interface GraphIndex {
  readonly graph: BlueprintGraph;
  readonly nodesById: ReadonlyMap<string, GraphNode>;
  readonly formsById: ReadonlyMap<string, FormDefinition>;
  /** Nodes of type "form", in the order the API listed them. */
  readonly formNodes: readonly GraphNode[];
}

export function indexGraph(graph: BlueprintGraph): GraphIndex {
  return {
    graph,
    nodesById: new Map(graph.nodes.map((node) => [node.id, node])),
    formsById: new Map(graph.forms.map((form) => [form.id, form])),
    formNodes: graph.nodes.filter(isFormNode),
  };
}

export function isFormNode(node: GraphNode): boolean {
  return node.type === "form";
}

/** The form definition a node points at, if it is a form node and the definition exists. */
export function formOf(index: GraphIndex, node: GraphNode): FormDefinition | undefined {
  return isFormNode(node) ? index.formsById.get(node.data.component_id) : undefined;
}

/** Prerequisite ids of a node that actually exist in the graph, in declared order. */
export function prerequisitesOf(index: GraphIndex, nodeId: string): string[] {
  const node = index.nodesById.get(nodeId);
  if (!node) return [];
  return unique(node.data.prerequisites.filter((id) => index.nodesById.has(id)));
}

export function unique<T>(items: readonly T[]): T[] {
  return [...new Set(items)];
}
