# 04 · Decisions log

**Date:** Thu 15 Oct 2026. Companion to [02 · Architecture](02-architecture-and-roadmap.md): where 02 says what was decided, this says where each decision landed, commit by commit, and how the brief's criteria are met. Hashes are from `git log --oneline`.

## The criteria, in one table

| Criterion                                            | Where to look                                                                                                                                 |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Any combination of sources, no code changes (**B3**) | `prefill/config.ts` + `prefill/registry.ts` (D4); `prefill/combinations.test.ts` proves all 7 subsets; `VITE_PREFILL_SOURCES` in the README   |
| Easy to add a source (**B5**)                        | `2efb351` adds one in four files; [docs/03](03-adding-a-data-source.md) walks through it                                                      |
| Good tests (**B4**)                                  | 133 tests, each layer, one full-flow test with only `fetch` stubbed; the README's test table                                                  |
| View and edit the mapping (**B2**)                   | `a81c507` full flow; the panel, rows and picker match the reference screenshots including the switch, `completed_at`, and the two-pane picker |
| Separation of concerns                               | `ui → prefill → graph → api`, one direction; the domain has no React (D1)                                                                     |
| Component hierarchy and composition                  | generic `Dialog`/`CollapsibleGroup`/`SearchBox`/`Switch`, composed by `DataPicker`/`PrefillPanel`/`PrefillRow` (D9)                           |
| How to run locally                                   | README "Running locally"; Compose with everything pinned (D10); CI runs the same stack                                                        |
| Modern React                                         | React 19, hooks only, a reducer for state, `useMemo` for derived values, no `setState` in effect bodies, ARIA roles and names everywhere      |

## Commit by commit

| Commit    | What                                                        | Why / decision                                                                                                                                                |
| --------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `6018f9a` | docs: the brief, the reference UI, the real API vs the mock | Read before writing code. The screenshots show a switch, `completed_at` and a two-pane picker the text never mentions; the real schema differs from the mock. |
| `47eadc4` | docs: decisions D1–D10 and the roadmap                      | Each with its rejected alternative, so they can be discussed.                                                                                                 |
| `f3b3af7` | chore: scaffold                                             | Vite 8, React 19, strict TS, ESLint 10 type-checked rules, Prettier, Vitest 5. `npm run check` is what every commit passes.                                   |
| `236de43` | chore: Docker Compose, CI                                   | D10. The mock's port is hardcoded, so host ports are variables.                                                                                               |
| `69af3f0` | feat(api): validated client                                 | D7. zod schema written against the real API docs (nullable arrays, open node types). Errors say what went wrong and how to start the server.                  |
| `8fb3cdd` | feat(graph): index and traversal                            | D8. Direct = one edge; transitive = ancestors − direct; every node type takes part; diamond and cycle safe.                                                   |
| `614ad80` | feat(prefill): references and the source contract           | D2, D3. Typed references; labels derived by sources; kinds open for augmentation.                                                                             |
| `107ee2b` | feat(prefill): the three sources from the brief             | One factory for direct/transitive; `completed_at` + all fields incl. `button`, as the reference shows; global data = `action.*`, `clientOrg.*`.               |
| `9fa2c45` | feat(prefill): registry and configuration                   | D4. The 7-combination test.                                                                                                                                   |
| `6b7ffad` | feat(prefill): mapping state                                | D6. Reducer with the per-form switch; `input_mapping` seam (`toExpression` / `fromExpression` / `stateFromGraph`).                                            |
| `cd89dd9` | feat(ui): Dialog, CollapsibleGroup, SearchBox, Switch       | D9. Generic; focus and keyboard handled once.                                                                                                                 |
| `77ac9b3` | feat(ui): form list and prefill panel                       | The reference panel; `App` + composition root with the "Invalid configuration" screen.                                                                        |
| `86ddfd6` | feat(ui): two-pane data picker                              | D5. Alphabetical group order like the reference; search opens matching groups; Select disabled until a highlight.                                             |
| `a81c507` | test: full prefill flow                                     | Only `fetch` is faked.                                                                                                                                        |
| `ca57a5f` | refactor(prefill): parse any `{ type, value }` expression   | Found while adding the example source: a new kind could be saved but not read back. Parsing is shape-only; sources judge meaning.                             |
| `2efb351` | feat(prefill): example source                               | B5, proven: one file, one line, one id. One test had asserted on the whole registry; it now names its three ids.                                              |

## Things I would do next, in order

1. **Save:** `PUT action-blueprint-graph-put` with `toExpression` per mapped field, behind the same reducer (a `save` thunk or a small effect; the mock cannot test it).
2. **A run-data-store source:** `data_store_schema.keys` from the real response is exactly a `DataSource` (one group, keys as elements).
3. **Async sources:** `getGroups` returning a Promise, with a loading row per group in the picker.
4. **Keyboard navigation inside the picker tree** (arrow keys), on top of the tab order that works today.

## Left out on purpose

Graph view (B1). Styling beyond hand-written CSS (B2). Persistence (no write endpoint in the mock). A settings UI for sources (configuration is the brief's word, not a screen).
