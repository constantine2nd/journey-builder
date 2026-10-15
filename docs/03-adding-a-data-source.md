# 03 · How to add a data source

This guide follows a real commit: **`2efb351 feat(prefill): example source - blueprint properties`**. `git show 2efb351` shows the whole change: one new source file, its test, one line in the registry, one line in `.env.example`.

---

## What a data source is

The picker never knows where its options come from. It asks every active **source** for groups of elements and renders them (decision D2):

```ts
// src/prefill/source.ts
interface DataSource {
  id: string; // stable: used in VITE_PREFILL_SOURCES and shown in docs
  label: string; // human name, shown in the picker's detail pane
  getGroups(context: SourceContext): DataGroup[];
  describe(reference: DataReference, context: SourceContext): string | undefined;
}

interface SourceContext {
  index: GraphIndex; // the loaded blueprint, indexed (nodes, forms, traversal helpers)
  targetNode: GraphNode; // the form whose field is being configured
}
```

- A **group** (`{ id, label, badge?, elements }`) is one collapsible section of the picker.
- An **element** (`{ reference, label }`) is one selectable row. The `reference` is what gets stored.
- `describe` turns a stored reference back into the row label (`Form A.email`). Return `undefined` for references that are not yours; the app then asks the next source, and falls back to "(unavailable)" if nobody answers.

A **reference** is typed data, not a string (decision D3). The built-in kinds are `form_field`, `form_meta` and `global`; a source may add its own.

| id                        | File                             | Offers                                                    |
| ------------------------- | -------------------------------- | --------------------------------------------------------- |
| `direct_dependencies`     | `sources/formSources.ts`         | elements of forms the target form directly depends on     |
| `transitive_dependencies` | `sources/formSources.ts`         | elements of forms it depends on through other forms       |
| `global_data`             | `sources/globalData.ts`          | Action Properties, Client Organisation Properties         |
| `blueprint_properties`    | `sources/blueprintProperties.ts` | **the example below:** properties of the loaded blueprint |

---

## The three steps

### 1. Write the source (one new file)

`src/prefill/sources/blueprintProperties.ts`, trimmed:

```ts
// Its own reference kind, declared from this file. Nothing else changes.
declare module "../model" {
  interface DataReferenceKinds {
    blueprint_property: { property: string };
  }
}

const PROPERTIES = [
  { property: "id", read: (graph) => graph.id },
  { property: "name", read: (graph) => graph.name },
  { property: "tenant_id", read: (graph) => graph.tenant_id },
  { property: "category", read: (graph) => graph.category },
];

export const blueprintPropertiesSource: DataSource = {
  id: "blueprint_properties",
  label: "Blueprint properties",

  getGroups({ index }) {
    const present = PROPERTIES.filter(({ read }) => read(index.graph) != null);
    return [
      {
        id: "blueprint",
        label: "Blueprint Properties",
        elements: present.map(({ property }) => ({
          reference: { kind: "blueprint_property", property },
          label: property,
        })),
      },
    ];
  },

  describe(reference) {
    if (reference.kind !== "blueprint_property") return undefined;
    if (!PROPERTIES.some(({ property }) => property === reference.property))
      return undefined;
    return `Blueprint.${reference.property}`;
  },
};
```

Choices to make here:

- **The id** is permanent once mappings are saved with it. `snake_case`, like the others.
- **Your own reference kind, or a built-in one.** This source adds `blueprint_property` by augmenting `DataReferenceKinds`; a source that offers fields of forms should reuse `form_field` so the existing form sources can describe them too.
- **Static or computed.** `global_data` returns constants; this one reads the graph; the form sources walk from `context.targetNode`. Return `[]` to offer nothing for a given form.
- **Fields of some set of forms?** Don't write a new source: `createFormSource({ id, label, badge, sourceNodeIds })` in `formSources.ts` takes a different `sourceNodeIds(index, targetNodeId)` and does the rest.

### 2. Register it (one line)

```diff
 // src/prefill/registry.ts
 export const registeredSources: readonly DataSource[] = [
   directDependenciesSource,
   transitiveDependenciesSource,
   globalDataSource,
+  blueprintPropertiesSource,
 ];
```

The registry is every source the app _knows_. Its order is the default order sources are queried.

### 3. Enable it (configuration, not code)

Which sources are _active_, and in what order, is `VITE_PREFILL_SOURCES` (decision D4):

| `VITE_PREFILL_SOURCES`                                    | Effect                                               |
| --------------------------------------------------------- | ---------------------------------------------------- |
| unset or empty                                            | every registered source, so the new one is on        |
| `direct_dependencies,transitive_dependencies,global_data` | the brief's three; the new one is off                |
| `blueprint_properties,direct_dependencies`                | just those two, queried in that order                |
| `blueprint_props`                                         | "Invalid configuration" screen listing the valid ids |

```bash
VITE_PREFILL_SOURCES=blueprint_properties,direct_dependencies docker compose up
```

Add the id to the list in `.env.example` so it can be found.

---

## Test it

`src/prefill/sources/blueprintProperties.test.ts` calls the source with the mock graph and checks the exact groups and references, the case of a missing property, `describe` for its own and for foreign references, and that its references round-trip through `toExpression` / `fromExpression`. A source is a plain object with two functions, so none of that needs React.

Nothing else changes: UI tests that assert exact groups name the three sources they are about (`resolveSources([...])`) rather than the whole registry, so adding a source only ever adds tests.

---

## What you did not have to touch

- **Components:** the picker, panel and rows render any source's groups and labels.
- **State and expressions:** the reducer stores any reference; `fromExpression` reads any `{ type, value }` shape, so the new kind hydrates from a saved `input_mapping` too.
- **Configuration code:** `resolveSources` looks ids up in the registry.
- **Types:** `DataSource` is the only contract; a new reference kind is declared from the source's own file.

## Checklist

1. `src/prefill/sources/<name>.ts` exporting a `DataSource` with a new, stable `id`.
2. A test next to it.
3. One line in `src/prefill/registry.ts`.
4. The id added to the list in `.env.example`.
5. `npm run check` (or `docker compose run --rm --no-deps app npm run check`).
