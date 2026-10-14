import type { DataSource } from "./source";
import {
  directDependenciesSource,
  transitiveDependenciesSource,
} from "./sources/formSources";
import { globalDataSource } from "./sources/globalData";

/**
 * Every data source the app knows about (decision D4). Which of them are
 * active, and in what order, is configuration (see config.ts), not code.
 *
 * To add a source: implement DataSource in src/prefill/sources/<name>.ts and
 * list it here. It can then be enabled by its id without touching anything
 * else. Walkthrough: docs/03-adding-a-data-source.md.
 */
export const registeredSources: readonly DataSource[] = [
  directDependenciesSource,
  transitiveDependenciesSource,
  globalDataSource,
];
