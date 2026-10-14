import type { DataReference } from "./model";

/**
 * Prefill configuration of every form, as a pure reducer (decision D6).
 * Per form: whether prefill is on (the switch in the reference panel) and
 * which reference each field maps to. Absent form = defaults; absent field
 * = not mapped. Nothing here knows about React or about sources.
 */

export interface FormPrefill {
  readonly enabled: boolean;
  readonly mappings: Readonly<Record<string, DataReference>>;
}

export type PrefillState = Readonly<Record<string, FormPrefill>>;

export type PrefillAction =
  | { type: "enable"; nodeId: string }
  | { type: "disable"; nodeId: string }
  | { type: "set"; nodeId: string; field: string; reference: DataReference }
  | { type: "clear"; nodeId: string; field: string }
  /** Replaces everything, e.g. with mappings loaded from the API. */
  | { type: "hydrate"; state: PrefillState };

export const EMPTY_STATE: PrefillState = Object.freeze({});

const DEFAULT_FORM: FormPrefill = Object.freeze({
  enabled: true,
  mappings: Object.freeze({}),
});

/** The configuration of one form; defaults when nothing was set yet. */
export function formPrefill(state: PrefillState, nodeId: string): FormPrefill {
  return state[nodeId] ?? DEFAULT_FORM;
}

export function prefillReducer(state: PrefillState, action: PrefillAction): PrefillState {
  switch (action.type) {
    case "enable":
    case "disable":
      return update(state, action.nodeId, (form) => ({
        ...form,
        enabled: action.type === "enable",
      }));

    case "set":
      return update(state, action.nodeId, (form) => ({
        ...form,
        mappings: { ...form.mappings, [action.field]: action.reference },
      }));

    case "clear":
      return update(state, action.nodeId, (form) => {
        if (!(action.field in form.mappings)) return form;
        return {
          ...form,
          mappings: Object.fromEntries(
            Object.entries(form.mappings).filter(([field]) => field !== action.field),
          ),
        };
      });

    case "hydrate":
      return action.state;
  }
}

function update(
  state: PrefillState,
  nodeId: string,
  change: (form: FormPrefill) => FormPrefill,
): PrefillState {
  const before = formPrefill(state, nodeId);
  const after = change(before);
  return after === before ? state : { ...state, [nodeId]: after };
}
