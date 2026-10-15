import type { BlueprintGraph } from "../../api/schema";
import type { DataSource } from "../source";

/**
 * Example of an added source (docs/03): properties of the loaded blueprint.
 * It shows the three things a source may do: declare its own reference
 * kind, compute its elements from the context (here the graph; the form
 * sources use the target node), and describe its references.
 */

// Its own reference kind, added from this file (decision D3).
declare module "../model" {
  interface DataReferenceKinds {
    blueprint_property: { property: string };
  }
}

const PROPERTIES: readonly {
  property: string;
  read: (graph: BlueprintGraph) => string | null | undefined;
}[] = [
  { property: "id", read: (graph) => graph.id },
  { property: "name", read: (graph) => graph.name },
  { property: "tenant_id", read: (graph) => graph.tenant_id },
  { property: "category", read: (graph) => graph.category },
];

export const blueprintPropertiesSource: DataSource = {
  id: "blueprint_properties",
  label: "Blueprint properties",

  getGroups({ index }) {
    // Only properties this blueprint actually has.
    const present = PROPERTIES.filter(({ read }) => read(index.graph) != null);
    return [
      {
        id: "blueprint",
        label: "Blueprint Properties",
        elements: present.map(({ property }) => ({
          reference: { kind: "blueprint_property", property },
          label: property,
        })),
      },
    ];
  },

  describe(reference) {
    if (reference.kind !== "blueprint_property") return undefined;
    if (!PROPERTIES.some(({ property }) => property === reference.property))
      return undefined;
    return `Blueprint.${reference.property}`;
  },
};
