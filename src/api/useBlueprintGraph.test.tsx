import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import rawGraph from "../test/fixtures/graph.json";
import { DEFAULT_ENDPOINT } from "./client";
import { useBlueprintGraph } from "./useBlueprintGraph";

describe("useBlueprintGraph", () => {
  it("goes from loading to ready", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json(rawGraph)),
    );

    const { result } = renderHook(() => useBlueprintGraph(DEFAULT_ENDPOINT));

    expect(result.current).toEqual({ status: "loading" });
    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });
    expect(result.current.status === "ready" && result.current.graph.name).toBe(
      "Onboard Customer 0",
    );
  });

  it("goes from loading to error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 500, statusText: "Boom" })),
    );

    const { result } = renderHook(() => useBlueprintGraph(DEFAULT_ENDPOINT));

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });
    expect(result.current.status === "error" && result.current.error.message).toMatch(
      /answered 500 Boom/,
    );
  });

  it("aborts the request on unmount", () => {
    const fetchMock = vi.fn((_url: string, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(init.signal?.reason as Error);
        });
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const { unmount } = renderHook(() => useBlueprintGraph(DEFAULT_ENDPOINT));
    const signal = fetchMock.mock.calls[0]?.[1]?.signal;

    expect(signal?.aborted).toBe(false);
    unmount();
    expect(signal?.aborted).toBe(true);
  });
});
