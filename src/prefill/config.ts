import { registeredSources } from "./registry";
import type { DataSource } from "./source";

/**
 * Which sources are active is configuration (decision D4): a comma-separated
 * list of source ids, e.g. VITE_PREFILL_SOURCES=direct_dependencies,global_data.
 * Unset or empty means every registered source; the order given is the order
 * sources are queried; an unknown id fails fast.
 */

/** Parses the raw variable. Returns undefined when nothing is configured. */
export function parseSourceIds(raw: string | undefined): string[] | undefined {
  const ids = (raw ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id !== "");
  return ids.length > 0 ? [...new Set(ids)] : undefined;
}

export class SourceConfigError extends Error {
  constructor(unknownIds: readonly string[], registry: readonly DataSource[]) {
    super(
      `Unknown prefill source${unknownIds.length > 1 ? "s" : ""}: ${unknownIds.join(", ")}. ` +
        `Available: ${registry.map((source) => source.id).join(", ")}.`,
    );
    this.name = "SourceConfigError";
  }
}

/** The active sources, in configured order. No ids means the whole registry. */
export function resolveSources(
  ids: readonly string[] | undefined,
  registry: readonly DataSource[] = registeredSources,
): DataSource[] {
  if (!ids) return [...registry];

  const byId = new Map(registry.map((source) => [source.id, source]));
  const unknown = ids.filter((id) => !byId.has(id));
  if (unknown.length > 0) throw new SourceConfigError(unknown, registry);

  return [...new Set(ids)].flatMap((id) => byId.get(id) ?? []);
}
