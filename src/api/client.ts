import { parseBlueprintGraph, type BlueprintGraph } from "./schema";

/**
 * Where the graph comes from. Every part is configuration because the mock
 * and the real API differ: the mock ignores the path parameters and has no
 * version segment, the real endpoint is
 * /api/v1/{tenant_id}/actions/blueprints/{action_blueprint_id}/{blueprint_version_id}/graph.
 */
export interface GraphEndpoint {
  baseUrl: string;
  tenantId: string;
  blueprintId: string;
  /** Omitted for the mock server, which has no version segment. */
  blueprintVersionId?: string | undefined;
}

export const DEFAULT_ENDPOINT: GraphEndpoint = {
  baseUrl: "http://localhost:3000",
  tenantId: "1",
  blueprintId: "bp_01jk766tckfwx84xjcxazggzyc",
};

/** An empty variable means "not set". */
const nonEmpty = (value: string | undefined) => (value === "" ? undefined : value);

/** Reads the endpoint from Vite env variables, falling back to the mock defaults. */
export function endpointFromEnv(env: ImportMetaEnv = import.meta.env): GraphEndpoint {
  return {
    baseUrl: env.VITE_API_BASE_URL ?? DEFAULT_ENDPOINT.baseUrl,
    tenantId: env.VITE_TENANT_ID ?? DEFAULT_ENDPOINT.tenantId,
    blueprintId: env.VITE_BLUEPRINT_ID ?? DEFAULT_ENDPOINT.blueprintId,
    blueprintVersionId: nonEmpty(env.VITE_BLUEPRINT_VERSION_ID),
  };
}

/** URL of the `action-blueprint-graph-get` endpoint. */
export function graphUrl(endpoint: GraphEndpoint): string {
  const segments = [
    "api/v1",
    endpoint.tenantId,
    "actions/blueprints",
    endpoint.blueprintId,
    ...(endpoint.blueprintVersionId ? [endpoint.blueprintVersionId] : []),
    "graph",
  ];
  return `${endpoint.baseUrl.replace(/\/+$/, "")}/${segments.join("/")}`;
}

/** Thrown when the server cannot be reached or answers with a non-2xx status. */
export class GraphRequestError extends Error {
  constructor(
    message: string,
    readonly url: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "GraphRequestError";
  }
}

/** Fetches and validates the blueprint graph. */
export async function fetchBlueprintGraph(
  endpoint: GraphEndpoint,
  signal?: AbortSignal,
): Promise<BlueprintGraph> {
  const url = graphUrl(endpoint);

  let response: Response;
  try {
    response = await fetch(url, {
      signal: signal ?? null,
      headers: { Accept: "application/json" },
    });
  } catch (cause) {
    // Aborts are the caller's doing; everything else means the server is not there.
    if (signal?.aborted) throw cause;
    throw new GraphRequestError(
      `Could not reach the server at ${url}. Is it running? ` +
        "`docker compose up` starts the app together with the mock server.",
      url,
      { cause },
    );
  }

  if (!response.ok) {
    throw new GraphRequestError(
      `The server answered ${response.status} ${response.statusText} for ${url}.`,
      url,
    );
  }

  return parseBlueprintGraph(await response.json());
}
