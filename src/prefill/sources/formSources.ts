import {
  directDependencyIds,
  formOf,
  transitiveDependencyIds,
  type GraphIndex,
} from "../../graph";
import { fieldNames } from "../fields";
import type { DataReference } from "../model";
import type { DataElement, DataGroup, DataSource, SourceContext } from "../source";

interface FormSourceOptions {
  id: string;
  label: string;
  /** Hint shown next to each form group, e.g. "direct". */
  badge: string;
  /** Which upstream nodes this source offers for the target node. */
  sourceNodeIds: (index: GraphIndex, targetNodeId: string) => string[];
}

/** Submission metadata every completed form has, offered before its fields. */
const FORM_META: readonly { property: "completed_at"; label: string }[] = [
  { property: "completed_at", label: "completed_at" },
];

/**
 * Builds a source that offers the elements of some upstream forms, one group
 * per form. The two sources below differ only in which forms they pick, so
 * "fields of forms two steps up" would be a third call of this factory.
 */
export function createFormSource(options: FormSourceOptions): DataSource {
  const nodeIdsFor = (context: SourceContext) =>
    new Set(options.sourceNodeIds(context.index, context.targetNode.id));

  return {
    id: options.id,
    label: options.label,

    getGroups(context) {
      const groups: DataGroup[] = [];
      for (const nodeId of nodeIdsFor(context)) {
        const node = context.index.nodesById.get(nodeId);
        const form = node && formOf(context.index, node);
        if (!node || !form) continue; // not a form (e.g. a branch): nothing to offer

        const meta: DataElement[] = FORM_META.map(({ property, label }) => ({
          reference: { kind: "form_meta", nodeId, property },
          label,
        }));
        const fields: DataElement[] = fieldNames(form).map((field) => ({
          reference: { kind: "form_field", nodeId, field },
          label: field,
        }));
        groups.push({
          id: nodeId,
          label: node.data.name,
          badge: options.badge,
          elements: [...meta, ...fields],
        });
      }
      return groups;
    },

    describe(reference, context) {
      if (reference.kind !== "form_field" && reference.kind !== "form_meta")
        return undefined;
      if (!nodeIdsFor(context).has(reference.nodeId)) return undefined;
      const node = context.index.nodesById.get(reference.nodeId);
      if (!node) return undefined;
      return `${node.data.name}.${elementName(reference)}`;
    },
  };
}

function elementName(reference: DataReference): string {
  switch (reference.kind) {
    case "form_field":
      return reference.field;
    case "form_meta":
      return reference.property;
    default:
      return reference.kind;
  }
}

/** Brief, source 1: fields of forms the target form directly depends on. */
export const directDependenciesSource = createFormSource({
  id: "direct_dependencies",
  label: "Direct dependencies",
  badge: "direct",
  sourceNodeIds: directDependencyIds,
});

/** Brief, source 2: fields of forms the target form transitively depends on. */
export const transitiveDependenciesSource = createFormSource({
  id: "transitive_dependencies",
  label: "Transitive dependencies",
  badge: "transitive",
  sourceNodeIds: transitiveDependencyIds,
});
