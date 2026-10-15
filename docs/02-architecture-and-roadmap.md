# 02 · Architecture decisions and roadmap

**Date:** Tue 13 Oct 2026
**Inputs:** [01 · The brief](01-brief.md), cited as **B1–B5** (bold requirements) and **F1–F7** (facts in §4).

Each decision below records the choice, the reason, and what was rejected. They are numbered **D1–D10** and referenced from code comments and later docs.

---

## Decisions

### D1 · No starter; a small, layered codebase

Build from an empty Vite project. The live session builds on this code, so it must be fully understood; a layered layout keeps each part small enough to explain in a sentence.

```
src/
  api/      fetch and validate the blueprint graph         (no React except one hook)
  graph/    the DAG: index, direct / transitive traversal  (pure functions)
  prefill/  the domain: references, sources, config, state (pure functions)
  ui/       React components                               (the only place that renders)
  main.tsx  composition root: config → sources → <App>
```

Dependencies point one way: `ui → prefill → graph → api/types`. _Rejected:_ feature folders (the app has one feature) and the starter (ownership).

### D2 · A data source is one small contract (B3, B5, F1)

```ts
interface DataSource {
  id: string; // stable, used in configuration and stored in mappings
  label: string; // human name of the source
  getGroups(context: SourceContext): DataGroup[]; // what this source offers for the target form
  describe(reference: DataReference): string; // display label for a stored selection
}
```

`SourceContext` carries the graph, the target node, and a graph index. A group is `{ id, label, elements: DataElement[] }`, an element is `{ reference, label }`. The picker renders whatever comes back; it does not know what a source is. _Rejected:_ a class hierarchy (nothing to inherit), async sources now (the brief has no async data; the contract can grow a Promise later without touching callers).

### D3 · Typed references, not strings (F2)

A selection is stored as a discriminated union:

```ts
type DataReference =
  | { kind: "form_field"; nodeId: string; field: string }
  | { kind: "form_meta"; nodeId: string; property: "completed_at" }
  | { kind: "global"; group: string; key: string };
```

A new source adds a variant. The label (`Form A.email`) is **derived** by `describe()`, never copied into state, so renaming a form updates every row. This is also what a future `toExpression(reference)` for `input_mapping` would consume. _Rejected:_ opaque string keys (`"<nodeId>:<field>"`) with a cached label; cheaper today, a parsing problem tomorrow.

### D4 · Which sources are active is configuration (B3)

A registry lists every source the app knows. `VITE_PREFILL_SOURCES` (comma-separated ids) picks the active subset **and their order**; unset means all; an unknown id fails fast with the valid list. The composition root resolves it once and passes `sources` into `<App>`, so tests and an embedding app can pass any combination directly. _Rejected:_ a settings screen (unasked-for UI); a hardcoded array (the gap itself).

### D5 · Picker group order is presentation (F4)

The reference shows globals first, then forms alphabetically. Sources are queried in configured order; the picker then sorts groups with a pluggable comparator whose default matches the reference. _Rejected:_ hardcoding the reference order inside the sources.

### D6 · State is a pure reducer with an `enabled` flag per form (F3, F7)

`prefillReducer` handles `enable`, `disable`, `set`, `clear`, `hydrate`. `hydrate` takes the nodes' `input_mapping` so that, when the real API returns saved mappings, they appear. A `usePrefill` hook binds it with `useReducer`. _Rejected:_ a state library (one reducer, no need); context (the tree is three levels deep).

### D7 · Parse the response with a schema (F5)

A zod schema validates the response, turns the real API's `null` arrays into `[]`, keeps unknown node types, and ignores fields the app does not use. A malformed response is an error screen with the path that failed, not a crash in a `.sort()`. _Rejected:_ `as BlueprintGraph` (trusts the mock, not the real API).

### D8 · Only `form` nodes are listed and offered; all nodes take part in traversal (F5)

The list shows forms. A non-form node (branch, trigger, …) still counts as a step in a dependency path, so `A → branch → D` keeps A reachable from D. Sources skip nodes without a form definition.

### D9 · Generic UI pieces, prefill-specific composition

`Dialog`, `CollapsibleGroup`, `SearchBox`, `Switch` know nothing about prefill. `PrefillPanel`, `PrefillRow`, `DataPicker` compose them. Every interactive element has a role and an accessible name; tests query by those. Styling is hand-written CSS (B2).

### D10 · Docker is the supported way to run it

Node, dependencies, the mock server commit and the ports are pinned in Compose; "how do I run this locally" has one answer on every machine. CI runs the same Compose stack. A no-Docker path is documented as a fallback.

---

## Out of scope, on purpose

- Graph view (B1). Visual polish (B2). Persistence: the mock has no write endpoint (F7). Async sources (D2). These are each one commit if asked for in the live session.

---

## Roadmap

Each commit passes `npm run check` (typecheck, lint, format, tests) in the container before it is made.

### Tue 13 Oct · read, decide, set up

1. `docs: the brief, the reference UI, and the real API vs the mock`
2. `docs: architecture decisions and roadmap` (this document)
3. `chore: scaffold - Vite, React 19, strict TypeScript, lint, format, tests`
4. `chore: Docker Compose with the pinned mock server; CI`
5. `feat(api): validated client for action-blueprint-graph-get` (D7)

### Wed 14 Oct · the domain, no UI

6. `feat(graph): index and dependency traversal` (D8)
7. `feat(prefill): data references and the data source contract` (D2, D3)
8. `feat(prefill): the three sources from the brief` (done before the registry, which needs them)
9. `feat(prefill): source registry and configuration` (D4) + the 7-combination test
10. `feat(prefill): mapping state` (D6)

### Thu 15 Oct · UI, integration, docs

11. `feat(ui): Dialog, CollapsibleGroup, SearchBox, Switch` (D9)
12. `feat(ui): form list and prefill panel`
13. `feat(ui): two-pane data picker` (D5)
14. `test: full prefill flow`
15. `refactor(prefill): parse any { type, value } expression` (found while adding the example), then `feat(prefill): example source` + `docs: how to add a data source` (B5)
16. `docs: README and decisions log`

### Fri 16 Oct · submit

Fresh clone → `docker compose up --build` → walkthrough against the reference → push → CI green → submit.

## Status

- [x] Tue: 1–5
- [x] Wed: 6–10
- [x] Thu: 11–16
- [ ] Fri: submitted
