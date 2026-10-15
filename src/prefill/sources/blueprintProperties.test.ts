import { describe, expect, it } from "vitest";
import { indexGraph } from "../../graph";
import { mockGraph, NODE } from "../../test/builders";
import { fromExpression, toExpression } from "../expressions";
import type { SourceContext } from "../source";
import { blueprintPropertiesSource } from "./blueprintProperties";

const index = indexGraph(mockGraph);
const context: SourceContext = {
  index,
  targetNode: index.nodesById.get(NODE["Form D"]!)!,
};

describe("blueprintPropertiesSource", () => {
  it("offers the blueprint's properties in one group", () => {
    expect(blueprintPropertiesSource.getGroups(context)).toEqual([
      {
        id: "blueprint",
        label: "Blueprint Properties",
        elements: ["id", "name", "tenant_id", "category"].map((property) => ({
          reference: { kind: "blueprint_property", property },
          label: property,
        })),
      },
    ]);
  });

  it("leaves out properties the blueprint does not have", () => {
    const withoutCategory = indexGraph({ ...mockGraph, category: null });
    const groups = blueprintPropertiesSource.getGroups({
      ...context,
      index: withoutCategory,
    });
    expect(groups[0]?.elements.map((element) => element.label)).toEqual([
      "id",
      "name",
      "tenant_id",
    ]);
  });

  it("describes its own references and nothing else", () => {
    expect(
      blueprintPropertiesSource.describe(
        { kind: "blueprint_property", property: "name" },
        context,
      ),
    ).toBe("Blueprint.name");
    expect(
      blueprintPropertiesSource.describe(
        { kind: "blueprint_property", property: "nope" },
        context,
      ),
    ).toBeUndefined();
    expect(
      blueprintPropertiesSource.describe(
        { kind: "global", group: "action", key: "id" },
        context,
      ),
    ).toBeUndefined();
  });

  it("round-trips its references through input_mapping expressions", () => {
    const reference = { kind: "blueprint_property", property: "tenant_id" } as const;
    expect(fromExpression(toExpression(reference))).toEqual(reference);
  });
});
