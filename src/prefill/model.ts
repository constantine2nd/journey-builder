/**
 * What a prefill mapping points at (decision D3).
 *
 * A reference is typed data, not a display string: the label is derived by
 * the source that produced it, and a future `toExpression(reference)` can
 * serialise it into the API's `input_mapping`.
 *
 * The kinds are an open interface so that a new data source can add its own
 * shape from its own file, without editing this one:
 *
 *   declare module "../model" {
 *     interface DataReferenceKinds { my_kind: { someId: string } }
 *   }
 */
export interface DataReferenceKinds {
  /** A field of an upstream form, e.g. Form A's `email`. */
  form_field: { nodeId: string; field: string };
  /** Submission metadata of an upstream form, e.g. when Form A was completed. */
  form_meta: { nodeId: string; property: "completed_at" };
  /** A property of a global object, e.g. `clientOrg.name`. */
  global: { group: string; key: string };
}

export type DataReference = {
  [K in keyof DataReferenceKinds]: { readonly kind: K } & Readonly<DataReferenceKinds[K]>;
}[keyof DataReferenceKinds];

/**
 * A stable string for a reference: usable as a React key and for equality.
 * Property order does not matter.
 */
export function referenceKey(reference: DataReference): string {
  const { kind, ...rest } = reference;
  const parts = Object.entries(rest as Record<string, string>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`);
  return `${kind}:${parts.join(";")}`;
}

export function sameReference(a: DataReference, b: DataReference): boolean {
  return referenceKey(a) === referenceKey(b);
}
