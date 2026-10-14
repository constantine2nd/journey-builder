import { describe, expect, it } from "vitest";
import { parseSourceIds, resolveSources, SourceConfigError } from "./config";
import { registeredSources } from "./registry";
import type { DataSource } from "./source";

const ids = (sources: readonly DataSource[]) => sources.map((source) => source.id);

const stub = (id: string): DataSource => ({
  id,
  label: id,
  getGroups: () => [],
  describe: () => undefined,
});

describe("parseSourceIds", () => {
  it("returns undefined when nothing is configured", () => {
    expect(parseSourceIds(undefined)).toBeUndefined();
    expect(parseSourceIds("")).toBeUndefined();
    expect(parseSourceIds(" , ")).toBeUndefined();
  });

  it("splits on commas, trims, and drops repeats", () => {
    expect(parseSourceIds(" global_data , direct_dependencies,global_data ")).toEqual([
      "global_data",
      "direct_dependencies",
    ]);
  });
});

describe("resolveSources", () => {
  const registry = [stub("a"), stub("b"), stub("c")];

  it("uses the whole registry when nothing is configured", () => {
    expect(ids(resolveSources(undefined, registry))).toEqual(["a", "b", "c"]);
    expect(ids(resolveSources(undefined))).toEqual(ids(registeredSources));
  });

  it("returns the configured subset in the configured order", () => {
    expect(ids(resolveSources(["c", "a"], registry))).toEqual(["c", "a"]);
  });

  it("ignores a repeated id", () => {
    expect(ids(resolveSources(["b", "b"], registry))).toEqual(["b"]);
  });

  it("fails fast on an unknown id and names the valid ones", () => {
    expect(() => resolveSources(["a", "crm"], registry)).toThrow(SourceConfigError);
    expect(() => resolveSources(["a", "crm"], registry)).toThrow(
      "Unknown prefill source: crm. Available: a, b, c.",
    );
    expect(() => resolveSources(["x", "y"], registry)).toThrow(
      "Unknown prefill sources: x, y. Available: a, b, c.",
    );
  });

  it("resolves against the real registry by id", () => {
    expect(ids(resolveSources(["global_data", "direct_dependencies"]))).toEqual([
      "global_data",
      "direct_dependencies",
    ]);
  });
});

describe("registeredSources", () => {
  it("starts with the brief's three sources, each with a unique id", () => {
    expect(ids(registeredSources).slice(0, 3)).toEqual([
      "direct_dependencies",
      "transitive_dependencies",
      "global_data",
    ]);
    expect(new Set(ids(registeredSources)).size).toBe(registeredSources.length);
  });
});
