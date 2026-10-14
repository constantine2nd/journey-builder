import { describe, expect, it } from "vitest";
import { referenceKey, sameReference, type DataReference } from "./model";

describe("referenceKey", () => {
  it("is stable across property order", () => {
    const a: DataReference = { kind: "form_field", nodeId: "n1", field: "email" };
    const b: DataReference = { kind: "form_field", field: "email", nodeId: "n1" };
    expect(referenceKey(a)).toBe("form_field:field=email;nodeId=n1");
    expect(referenceKey(b)).toBe(referenceKey(a));
  });

  it("differs by kind and by value", () => {
    expect(
      referenceKey({ kind: "form_meta", nodeId: "n1", property: "completed_at" }),
    ).toBe("form_meta:nodeId=n1;property=completed_at");
    expect(referenceKey({ kind: "global", group: "action", key: "id" })).toBe(
      "global:group=action;key=id",
    );
  });
});

describe("sameReference", () => {
  it("compares by value", () => {
    expect(
      sameReference(
        { kind: "global", group: "action", key: "id" },
        { kind: "global", key: "id", group: "action" },
      ),
    ).toBe(true);
    expect(
      sameReference(
        { kind: "global", group: "action", key: "id" },
        { kind: "global", group: "action", key: "name" },
      ),
    ).toBe(false);
  });
});
