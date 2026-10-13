import { useEffect, useState } from "react";
import { fetchBlueprintGraph, type GraphEndpoint } from "./client";
import type { BlueprintGraph } from "./schema";

export type BlueprintGraphState =
  | { status: "loading" }
  | { status: "error"; error: Error }
  | { status: "ready"; graph: BlueprintGraph };

type SettledState = Exclude<BlueprintGraphState, { status: "loading" }>;

/**
 * Loads the graph once per endpoint and exposes loading / error / ready.
 * The request is aborted if the component unmounts or the endpoint changes.
 */
export function useBlueprintGraph(endpoint: GraphEndpoint): BlueprintGraphState {
  // The result is remembered together with the endpoint it answers, so a new
  // endpoint reads as "loading" without resetting state inside the effect.
  const [settled, setSettled] = useState<{
    endpoint: GraphEndpoint;
    state: SettledState;
  }>();

  useEffect(() => {
    const controller = new AbortController();

    fetchBlueprintGraph(endpoint, controller.signal).then(
      (graph) => {
        if (controller.signal.aborted) return;
        setSettled({ endpoint, state: { status: "ready", graph } });
      },
      (error: unknown) => {
        if (controller.signal.aborted) return;
        setSettled({
          endpoint,
          state: {
            status: "error",
            error: error instanceof Error ? error : new Error(String(error)),
          },
        });
      },
    );

    return () => {
      controller.abort();
    };
  }, [endpoint]);

  return settled?.endpoint === endpoint ? settled.state : { status: "loading" };
}
