import type { BlueprintGraph } from "../api/schema";
import type { DataReference } from "./model";
import { EMPTY_STATE, type FormPrefill, type PrefillState } from "./state";

/**
 * The saved form of a mapping. The real API stores, per node, an
 * `input_mapping` from field name to an expression object; the mock has
 * `{}` everywhere. These two functions are the seam between a typed
 * DataReference and that expression (decision D3). The shape follows the
 * `{ type, value }` vocabulary the mock's own form config uses
 * (`{ "type": "form_field", "value": "id" }`), extended with the data a
 * reference needs: `type` is the reference kind, `value` its fields.
 *
 * Parsing is shape-only on purpose: any kind round-trips, so a new source
 * with a new kind needs no change here. Whether a parsed reference is
 * meaningful is decided by the sources, through describe(); one nobody
 * recognises is shown as unavailable rather than hidden.
 */
export interface MappingExpression {
  type: DataReference["kind"];
  value: Record<string, string>;
}

export function toExpression(reference: DataReference): MappingExpression {
  const { kind, ...value } = reference;
  return { type: kind, value: { ...value } };
}

/** The reference an expression denotes, or undefined for a shape this app does not use. */
export function fromExpression(expression: unknown): DataReference | undefined {
  if (!isRecord(expression)) return undefined;
  const { type, value } = expression;
  if (typeof type !== "string" || !isRecord(value)) return undefined;
  if (!Object.values(value).every((item) => typeof item === "string")) return undefined;
  return { kind: type, ...value } as DataReference;
}

/**
 * Initial prefill state from the graph's saved `input_mapping`s. Expressions
 * of another shape are left out, so an unknown rule never breaks the UI.
 */
export function stateFromGraph(graph: BlueprintGraph): PrefillState {
  const state: Record<string, FormPrefill> = {};
  for (const node of graph.nodes) {
    const entries = Object.entries(node.data.input_mapping ?? {}).flatMap(
      ([field, expression]) => {
        const reference = fromExpression(expression);
        return reference ? [[field, reference] as const] : [];
      },
    );
    if (entries.length > 0) {
      state[node.id] = { enabled: true, mappings: Object.fromEntries(entries) };
    }
  }
  return Object.keys(state).length > 0 ? state : EMPTY_STATE;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
