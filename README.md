# Journey Builder · Prefill configuration

A React + TypeScript app for the Avantos take-home. It fetches a blueprint's form DAG from the `action-blueprint-graph-get` endpoint, lists the forms, and lets you view and edit each form's **prefill mapping**: which upstream data element fills which field. Data sources are pluggable: which ones are active, and in what order, is configuration; a new one is one file plus one line in a registry.

**Documentation** (the git history tells the same story, in the same order):

| Doc                                                                  | What it covers                                                       |
| -------------------------------------------------------------------- | -------------------------------------------------------------------- |
| [01 · The brief](docs/01-brief.md)                                   | What is asked, what the reference screenshots show, real API vs mock |
| [02 · Architecture and roadmap](docs/02-architecture-and-roadmap.md) | Decisions D1–D10 with the rejected alternatives; the plan            |
| [03 · How to add a data source](docs/03-adding-a-data-source.md)     | Step by step, following a real commit                                |
| [04 · Decisions log](docs/04-decisions-log.md)                       | Commit by commit: what, why, which decision; what was left out       |

---

## Running locally

The supported way is **Docker Compose** (decision D10). It starts the app and the Avantos mock server together with everything pinned, so every machine runs the same thing:

| What             | Pinned to                                                                                                  |
| ---------------- | ---------------------------------------------------------------------------------------------------------- |
| Node             | `node:22.23.3-alpine3.23` in both containers; `.nvmrc` matches                                             |
| App dependencies | `package-lock.json`, installed with `npm ci` at image build                                                |
| Mock server      | [`frontendchallengeserver`](https://github.com/mosaic-avantos/frontendchallengeserver) at commit `fdfbb9c` |
| Host ports       | `MOCK_API_PORT` (default 3000), `APP_PORT` (default 5173)                                                  |

```bash
docker compose up --build
```

- App: <http://localhost:5173>
- Mock API: <http://localhost:3000/api/v1/1/actions/blueprints/bp_01jk766tckfwx84xjcxazggzyc/graph>

The app container mounts the source, so edits reload in the browser. Stop with `Ctrl+C` or `docker compose down`. The standalone `docker-compose` v2 works the same way.

**Port already in use?** The mock server hardcodes 3000 inside its container, but the host ports are variables:

```bash
MOCK_API_PORT=3001 APP_PORT=5174 docker compose up --build
```

**Checks in the same environment:**

```bash
docker compose run --rm --no-deps app npm run check      # typecheck, lint, format, tests
docker compose run --rm --no-deps app npm run test:run
```

After changing dependencies: `docker compose up --build --renew-anon-volumes`.

### Without Docker

Use the Node in `.nvmrc` (`nvm use`), then in two terminals:

```bash
git clone https://github.com/mosaic-avantos/frontendchallengeserver && cd frontendchallengeserver && npm start
npm ci && npm run dev        # http://localhost:5173
```

### Scripts

| Command          | Does                                                                               |
| ---------------- | ---------------------------------------------------------------------------------- |
| `npm run dev`    | Vite dev server                                                                    |
| `npm run check`  | `typecheck` + `lint` + `format:check` + `test:run` (what CI and every commit pass) |
| `npm run test`   | Vitest in watch mode                                                               |
| `npm run build`  | Type-check and production build                                                    |
| `npm run format` | Prettier, write                                                                    |

---

## Configuration

Everything is read once in `src/main.tsx` (the composition root) from Vite env variables; see `.env.example`. With Compose, the first and last are set for you.

| Variable                    | Default                         | Meaning                                                                            |
| --------------------------- | ------------------------------- | ---------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL`         | `http://localhost:3000`         | Where the API is                                                                   |
| `VITE_TENANT_ID`            | `1`                             | Path parameter; the mock ignores it                                                |
| `VITE_BLUEPRINT_ID`         | `bp_01jk766tckfwx84xjcxazggzyc` | Path parameter; the mock ignores it                                                |
| `VITE_BLUEPRINT_VERSION_ID` | unset                           | The real API has a version segment; the mock does not. Unset = no segment          |
| `VITE_PREFILL_SOURCES`      | unset = all                     | Active data sources, comma-separated ids in query order. Unknown id = error screen |

Registered source ids: `direct_dependencies`, `transitive_dependencies`, `global_data`, `blueprint_properties` (the example from [docs/03](docs/03-adding-a-data-source.md)).

```bash
VITE_PREFILL_SOURCES=direct_dependencies docker compose up                       # one source
VITE_PREFILL_SOURCES=global_data,transitive_dependencies docker compose up       # two, in that order
VITE_PREFILL_SOURCES=direct_dependencies,transitive_dependencies,global_data \
  docker compose up                                                              # exactly the brief's three
```

---

## How it works

1. **Forms** on the left: the blueprint's form nodes, sorted by name. Click one.
2. **Prefill** panel on the right, as in the reference: the on/off switch, then one row per field. An unmapped row shows the field key; a mapped row reads `email: Form A.email` with a **×** that clears it.
3. Click an unmapped row → **Select data element to map**: search, a collapsible tree of groups on the left, the highlighted element's details on the right, **Cancel** / **Select**. Escape and × also close it; focus returns to the row.

Which groups appear comes from the active sources. For Form D with everything on: Action Properties, Client Organisation Properties, Form A (transitive), Form B (direct), Blueprint Properties, alphabetical like the reference. A form group offers `completed_at` and then every field, `button` included, as the reference shows.

Mappings are kept per form, in memory (the mock has no write endpoint). If a node's `input_mapping` contains expressions this app wrote, they are shown on load.

---

## Architecture

```
src/
  api/        schema.ts (zod, tolerant of the real API's nulls), client.ts, useBlueprintGraph.ts
  graph/      graphIndex.ts (nodes, forms, form nodes), traversal.ts (direct, ancestors, transitive)
  prefill/    model.ts (DataReference)         source.ts (DataSource, groups, describe)
              registry.ts, config.ts           groupOrder.ts
              state.ts (reducer), usePrefill.ts, expressions.ts (input_mapping seam), fields.ts
              sources/ formSources.ts, globalData.ts, blueprintProperties.ts
  ui/         Dialog, CollapsibleGroup, SearchBox, Switch        (generic)
              FormList, PrefillPanel, PrefillRow, DataPicker, JourneyBuilder   (prefill-specific)
  App.tsx     loading / error / ready
  main.tsx    composition root: env → endpoint + sources → <App>
  test/       graph.json fixture (the mock's), builders for small graphs
```

Dependencies point one way: `ui → prefill → graph → api`. Outside `ui`, only the two hooks import React, so the domain is tested without rendering.

### The extension point

```ts
interface DataSource {
  id: string;
  label: string;
  getGroups(context: SourceContext): DataGroup[]; // what to offer for the target form
  describe(reference: DataReference, context: SourceContext): string | undefined;
}
```

A source returns groups of elements; each element carries a typed **reference** (`{ kind: "form_field", nodeId, field }` and so on) that is what gets stored. Labels are derived from references by the sources, never copied into state. `src/prefill/registry.ts` lists every source; `VITE_PREFILL_SOURCES` picks the active ones. The picker renders whatever comes back.

**Adding a source** is one file, one registry line, one config id: [docs/03](docs/03-adding-a-data-source.md) walks through the commit that added `blueprint_properties`.

---

## Tests

133 tests, every layer, run with `npm run check`. Assertions are exact; UI tests query by role and accessible name.

| Layer         | Files                                                                         | Covers                                                                                                                                                                                  |
| ------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API           | `api/schema`, `api/client`, `api/useBlueprintGraph`                           | the mock's graph.json, null arrays, unknown node types, bad path named; URL with/without version; unreachable / non-2xx / abort / invalid body; loading → ready/error, abort on unmount |
| Graph         | `graph/graphIndex`, `graph/traversal`                                         | form nodes only; direct / transitive on the mock; diamond once; direct beats transitive; non-form node in the path; cycle; unknown ids                                                  |
| Sources       | `prefill/sources/*`, `prefill/source`                                         | exact groups and references per source; describe own vs foreign references; fallback label                                                                                              |
| Configuration | `prefill/config`, `prefill/combinations`, `prefill/groupOrder`                | parsing, subset, order, duplicates, unknown ids; **all 7 combinations** of the brief's sources; alphabetical vs source order                                                            |
| State         | `prefill/state`, `prefill/usePrefill`, `prefill/expressions`                  | set / clear / enable / hydrate, immutability; hook; expression round-trip, hydration from `input_mapping`                                                                               |
| UI pieces     | `ui/Dialog`, `ui/CollapsibleGroup`, `ui/SearchBox`, `ui/Switch`               | Escape, ×, outside click, focus in and back; expanded state; names                                                                                                                      |
| Screens       | `ui/FormList`, `ui/PrefillPanel`, `ui/DataPicker`, `ui/JourneyBuilder`, `App` | sorting and selection; rows, switch, disabled state; picker tree, detail pane, Select/Cancel, search; loading and error screens                                                         |
| **Full flow** | `App.flow`                                                                    | load → Form D → map email to Form A.email → clear; per-form; replace; Cancel / Escape / ×; switch; Form A globals only; empty                                                           |

---

## Not done, on purpose

- **Graph view** (B1) and **visual polish** (B2): a list and hand-written CSS.
- **Saving**: the mock is read-only. `expressions.ts` already produces the `input_mapping` shape; a `PUT` to `action-blueprint-graph-put` would hang off the reducer.
- **Async sources**: nothing in the brief is async; `getGroups` could return a Promise later without changing callers' contract.
