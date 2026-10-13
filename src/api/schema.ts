import { z } from "zod";

/**
 * Schema for the `action-blueprint-graph-get` response (decision D7).
 *
 * Written against the real API docs, not only the mock: arrays the real
 * schema declares as "array or null" are accepted as null and read as empty,
 * node types are an open string (the real API has nine), and fields the app
 * does not use are passed through untouched rather than rejected.
 */

/** `null` in the real API means "none"; the app never wants to see it. */
const arrayOrNull = <T extends z.ZodType>(item: T) =>
  z
    .array(item)
    .nullish()
    .transform((value) => value ?? []);

export const fieldSchemaPropertySchema = z.looseObject({
  avantos_type: z.string(),
  type: z.string(),
  title: z.string().optional(),
  format: z.string().optional(),
});

export const formDefinitionSchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  field_schema: z.looseObject({
    type: z.literal("object"),
    properties: z.record(z.string(), fieldSchemaPropertySchema),
    required: arrayOrNull(z.string()),
  }),
});

export const nodeDataSchema = z.looseObject({
  id: z.string(),
  component_key: z.string(),
  component_type: z.string(),
  /** For a form node, the id of its FormDefinition. */
  component_id: z.string(),
  name: z.string(),
  /** Component keys of the nodes this one depends on. */
  prerequisites: arrayOrNull(z.string()),
  /** Field name → expression; the saved form of a prefill mapping. */
  input_mapping: z.record(z.string(), z.unknown()).nullish(),
});

export const graphNodeSchema = z.looseObject({
  /** The component key; also used by edges and prerequisites. */
  id: z.string(),
  /** "form", "branch", "trigger", … — open, so unknown types still parse. */
  type: z.string(),
  data: nodeDataSchema,
});

export const graphEdgeSchema = z.object({
  /** Prerequisite node (component key). */
  source: z.string(),
  /** Dependent node (component key). */
  target: z.string(),
});

export const blueprintGraphSchema = z.looseObject({
  id: z.string(),
  tenant_id: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  category: z.string().nullish(),
  nodes: arrayOrNull(graphNodeSchema),
  edges: arrayOrNull(graphEdgeSchema),
  forms: arrayOrNull(formDefinitionSchema),
});

export type FieldSchemaProperty = z.infer<typeof fieldSchemaPropertySchema>;
export type FormDefinition = z.infer<typeof formDefinitionSchema>;
export type NodeData = z.infer<typeof nodeDataSchema>;
export type GraphNode = z.infer<typeof graphNodeSchema>;
export type GraphEdge = z.infer<typeof graphEdgeSchema>;
export type BlueprintGraph = z.infer<typeof blueprintGraphSchema>;

/** Thrown when the response is not a blueprint graph; `message` names the first bad path. */
export class InvalidGraphError extends Error {
  readonly issues: readonly z.core.$ZodIssue[];

  constructor(issues: readonly z.core.$ZodIssue[]) {
    const first = issues[0];
    const where = first && first.path.length > 0 ? ` at ${first.path.join(".")}` : "";
    super(
      `The server's response is not a blueprint graph${where}: ${first?.message ?? "unknown issue"}`,
    );
    this.name = "InvalidGraphError";
    this.issues = issues;
  }
}

/** Parses an unknown value into a BlueprintGraph or throws InvalidGraphError. */
export function parseBlueprintGraph(value: unknown): BlueprintGraph {
  const result = blueprintGraphSchema.safeParse(value);
  if (!result.success) throw new InvalidGraphError(result.error.issues);
  return result.data;
}
