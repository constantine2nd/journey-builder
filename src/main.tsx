import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { endpointFromEnv } from "./api/client";
import { App } from "./App";
import { parseSourceIds, resolveSources } from "./prefill/config";
import "./index.css";

/**
 * Composition root (decisions D1, D4): configuration is read here, once,
 * and everything below receives plain values. A bad VITE_PREFILL_SOURCES
 * is a configuration error screen, not a crash somewhere in the UI.
 */
const container = document.getElementById("root");
if (!container) throw new Error("index.html has no #root element");
const root = createRoot(container);

try {
  const endpoint = endpointFromEnv();
  const sources = resolveSources(parseSourceIds(import.meta.env.VITE_PREFILL_SOURCES));
  root.render(
    <StrictMode>
      <App endpoint={endpoint} sources={sources} />
    </StrictMode>,
  );
} catch (error) {
  root.render(
    <main className="app app--message" role="alert">
      <h1>Invalid configuration</h1>
      <p>{error instanceof Error ? error.message : String(error)}</p>
    </main>,
  );
}
