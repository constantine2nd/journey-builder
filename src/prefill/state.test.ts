import { describe, expect, it } from "vitest";
import type { DataReference } from "./model";
import { EMPTY_STATE, formPrefill, prefillReducer, type PrefillState } from "./state";

const email: DataReference = { kind: "form_field", nodeId: "a", field: "email" };
const name: DataReference = { kind: "form_field", nodeId: "a", field: "name" };

const reduce = (...actions: Parameters<typeof prefillReducer>[1][]) =>
  actions.reduce(prefillReducer, EMPTY_STATE);

describe("prefillReducer", () => {
  it("defaults a form to enabled with no mappings", () => {
    expect(formPrefill(EMPTY_STATE, "d")).toEqual({ enabled: true, mappings: {} });
  });

  it("sets and overwrites a field's mapping", () => {
    const state = reduce(
      { type: "set", nodeId: "d", field: "email", reference: email },
      { type: "set", nodeId: "d", field: "email", reference: name },
    );
    expect(formPrefill(state, "d").mappings).toEqual({ email: name });
  });

  it("keeps forms separate", () => {
    const state = reduce(
      { type: "set", nodeId: "d", field: "email", reference: email },
      { type: "set", nodeId: "e", field: "name", reference: name },
    );
    expect(Object.keys(formPrefill(state, "d").mappings)).toEqual(["email"]);
    expect(Object.keys(formPrefill(state, "e").mappings)).toEqual(["name"]);
  });

  it("clears a field and leaves the others", () => {
    const state = reduce(
      { type: "set", nodeId: "d", field: "email", reference: email },
      { type: "set", nodeId: "d", field: "name", reference: name },
      { type: "clear", nodeId: "d", field: "email" },
    );
    expect(formPrefill(state, "d").mappings).toEqual({ name });
  });

  it("returns the same state when clearing a field that is not mapped", () => {
    const before = reduce({ type: "set", nodeId: "d", field: "email", reference: email });
    expect(prefillReducer(before, { type: "clear", nodeId: "d", field: "name" })).toBe(
      before,
    );
    expect(prefillReducer(EMPTY_STATE, { type: "clear", nodeId: "x", field: "y" })).toBe(
      EMPTY_STATE,
    );
  });

  it("turns prefill off and on per form, keeping the mappings", () => {
    const off = reduce(
      { type: "set", nodeId: "d", field: "email", reference: email },
      { type: "disable", nodeId: "d" },
    );
    expect(formPrefill(off, "d")).toEqual({ enabled: false, mappings: { email } });
    expect(formPrefill(off, "e").enabled).toBe(true);

    const on = prefillReducer(off, { type: "enable", nodeId: "d" });
    expect(formPrefill(on, "d")).toEqual({ enabled: true, mappings: { email } });
  });

  it("hydrates with a whole state", () => {
    const loaded: PrefillState = { d: { enabled: true, mappings: { email } } };
    expect(prefillReducer(EMPTY_STATE, { type: "hydrate", state: loaded })).toBe(loaded);
  });

  it("never mutates the previous state", () => {
    const before = reduce({ type: "set", nodeId: "d", field: "email", reference: email });
    const snapshot = JSON.stringify(before);
    prefillReducer(before, { type: "set", nodeId: "d", field: "name", reference: name });
    prefillReducer(before, { type: "clear", nodeId: "d", field: "email" });
    prefillReducer(before, { type: "disable", nodeId: "d" });
    expect(JSON.stringify(before)).toBe(snapshot);
  });
});
