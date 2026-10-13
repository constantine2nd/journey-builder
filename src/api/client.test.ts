import { describe, expect, it, vi } from "vitest";
import rawGraph from "../test/fixtures/graph.json";
import {
  DEFAULT_ENDPOINT,
  GraphRequestError,
  endpointFromEnv,
  fetchBlueprintGraph,
  graphUrl,
} from "./client";
import { InvalidGraphError } from "./schema";

const MOCK_URL =
  "http://localhost:3000/api/v1/1/actions/blueprints/bp_01jk766tckfwx84xjcxazggzyc/graph";

function stubFetch(
  implementation: (url: string, init?: RequestInit) => Promise<Response>,
) {
  const fetchMock = vi.fn(implementation);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("graphUrl", () => {
  it("builds the mock server's path by default", () => {
    expect(graphUrl(DEFAULT_ENDPOINT)).toBe(MOCK_URL);
  });

  it("adds the version segment the real API has", () => {
    expect(
      graphUrl({
        baseUrl: "https://api.example/",
        tenantId: "t_1",
        blueprintId: "bp_1",
        blueprintVersionId: "bpv_1",
      }),
    ).toBe("https://api.example/api/v1/t_1/actions/blueprints/bp_1/bpv_1/graph");
  });
});

describe("endpointFromEnv", () => {
  it("falls back to the mock defaults", () => {
    expect(endpointFromEnv({} as ImportMetaEnv)).toEqual({
      ...DEFAULT_ENDPOINT,
      blueprintVersionId: undefined,
    });
  });

  it("reads every variable, treating an empty version as unset", () => {
    expect(
      endpointFromEnv({
        VITE_API_BASE_URL: "http://localhost:3001",
        VITE_TENANT_ID: "t",
        VITE_BLUEPRINT_ID: "bp",
        VITE_BLUEPRINT_VERSION_ID: "",
      } as ImportMetaEnv),
    ).toEqual({
      baseUrl: "http://localhost:3001",
      tenantId: "t",
      blueprintId: "bp",
      blueprintVersionId: undefined,
    });
  });
});

describe("fetchBlueprintGraph", () => {
  it("requests the graph URL and returns the parsed graph", async () => {
    const fetchMock = stubFetch(async () => Response.json(rawGraph));
    const { signal } = new AbortController();

    const graph = await fetchBlueprintGraph(DEFAULT_ENDPOINT, signal);

    expect(graph.name).toBe("Onboard Customer 0");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(MOCK_URL, {
      signal,
      headers: { Accept: "application/json" },
    });
  });

  it("reports a non-2xx status with the URL", async () => {
    stubFetch(async () => new Response("nope", { status: 404, statusText: "Not Found" }));

    const error = await fetchBlueprintGraph(DEFAULT_ENDPOINT).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(GraphRequestError);
    expect((error as GraphRequestError).message).toBe(
      `The server answered 404 Not Found for ${MOCK_URL}.`,
    );
  });

  it("explains how to start the server when it cannot be reached", async () => {
    const networkError = new TypeError("Failed to fetch");
    stubFetch(() => Promise.reject(networkError));

    const error = await fetchBlueprintGraph(DEFAULT_ENDPOINT).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(GraphRequestError);
    expect((error as GraphRequestError).message).toContain("docker compose up");
    expect((error as GraphRequestError).cause).toBe(networkError);
  });

  it("rethrows an abort unchanged", async () => {
    const controller = new AbortController();
    stubFetch((_url, init) => {
      controller.abort();
      return Promise.reject(init?.signal?.reason as Error);
    });

    await expect(
      fetchBlueprintGraph(DEFAULT_ENDPOINT, controller.signal),
    ).rejects.toThrow("This operation was aborted");
  });

  it("rejects a response that is not a blueprint graph", async () => {
    stubFetch(async () => Response.json({ hello: "world" }));

    await expect(fetchBlueprintGraph(DEFAULT_ENDPOINT)).rejects.toBeInstanceOf(
      InvalidGraphError,
    );
  });
});
