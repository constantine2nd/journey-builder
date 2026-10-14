import type { GraphNode } from "../api/schema";
import type { GraphIndex } from "../graph";
import type { DataReference } from "./model";

/**
 * The data source contract (decision D2). Everything the picker offers comes
 * from a DataSource; the picker renders whatever groups come back and never
 * knows what a source is. To add a source, implement this interface in one
 * file and register it (see docs/03).
 */

/** Everything a source needs to decide what to offer for one target form. */
export interface SourceContext {
  readonly index: GraphIndex;
  /** The form whose fields are being configured, e.g. Form D. */
  readonly targetNode: GraphNode;
}

/** One selectable thing, e.g. Form A's `email`. */
export interface DataElement {
  readonly reference: DataReference;
  /** Shown in the picker tree, e.g. "email". */
  readonly label: string;
}

/** A collapsible section of the picker, e.g. "Form A" or "Action Properties". */
export interface DataGroup {
  /** Unique within the source. */
  readonly id: string;
  readonly label: string;
  /** Optional hint rendered next to the label, e.g. "direct". */
  readonly badge?: string;
  readonly elements: readonly DataElement[];
}

export interface DataSource {
  /** Stable id: used in configuration (VITE_PREFILL_SOURCES) and in docs. */
  readonly id: string;
  /** Human name of the source, for documentation and error messages. */
  readonly label: string;
  /** The groups this source offers for the target form; may be empty. */
  getGroups(context: SourceContext): DataGroup[];
  /**
   * The display label of a reference this source produced, e.g. "Form A.email",
   * or undefined if the reference is not one of its own.
   */
  describe(reference: DataReference, context: SourceContext): string | undefined;
}

/**
 * The label of a stored reference, asking each source in turn. A reference no
 * active source recognises (its source was turned off, or the data changed)
 * still gets a readable fallback rather than crashing the row.
 */
export function describeReference(
  sources: readonly DataSource[],
  reference: DataReference,
  context: SourceContext,
): string {
  for (const source of sources) {
    const label = source.describe(reference, context);
    if (label !== undefined) return label;
  }
  return `(unavailable: ${reference.kind})`;
}
