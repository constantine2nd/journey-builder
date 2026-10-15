import type { GraphEndpoint } from "./api/client";
import { useBlueprintGraph } from "./api/useBlueprintGraph";
import type { DataSource } from "./prefill/source";
import { JourneyBuilder } from "./ui/JourneyBuilder";

interface AppProps {
  endpoint: GraphEndpoint;
  /** The active data sources, in display order (decision D4). */
  sources: readonly DataSource[];
}

/** Loads the blueprint, then hands it to the builder. */
export function App({ endpoint, sources }: AppProps) {
  const state = useBlueprintGraph(endpoint);

  switch (state.status) {
    case "loading":
      return (
        <main className="app app--message" aria-busy="true">
          Loading blueprint…
        </main>
      );
    case "error":
      return (
        <main className="app app--message" role="alert">
          <h1>Could not load the blueprint</h1>
          <p>{state.error.message}</p>
        </main>
      );
    case "ready":
      return <JourneyBuilder graph={state.graph} sources={sources} />;
  }
}
