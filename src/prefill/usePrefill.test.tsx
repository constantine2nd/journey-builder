import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { DataReference } from "./model";
import { usePrefill } from "./usePrefill";

const email: DataReference = { kind: "form_field", nodeId: "a", field: "email" };

describe("usePrefill", () => {
  it("sets, reads and clears a mapping", () => {
    const { result } = renderHook(() => usePrefill());

    act(() => {
      result.current.setMapping("d", "email", email);
    });
    expect(result.current.formPrefill("d").mappings).toEqual({ email });

    act(() => {
      result.current.clearMapping("d", "email");
    });
    expect(result.current.formPrefill("d").mappings).toEqual({});
  });

  it("toggles prefill per form", () => {
    const { result } = renderHook(() => usePrefill());

    act(() => {
      result.current.setEnabled("d", false);
    });
    expect(result.current.formPrefill("d").enabled).toBe(false);
    expect(result.current.formPrefill("e").enabled).toBe(true);
  });

  it("starts from the given state", () => {
    const { result } = renderHook(() =>
      usePrefill({ d: { enabled: false, mappings: { email } } }),
    );
    expect(result.current.formPrefill("d")).toEqual({
      enabled: false,
      mappings: { email },
    });
  });

  it("keeps the action functions stable across renders", () => {
    const { result, rerender } = renderHook(() => usePrefill());
    const first = result.current;
    rerender();
    expect(result.current.setMapping).toBe(first.setMapping);
    expect(result.current.clearMapping).toBe(first.clearMapping);
    expect(result.current.setEnabled).toBe(first.setEnabled);
  });
});
