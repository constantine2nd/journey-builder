import { useCallback, useReducer } from "react";
import type { DataReference } from "./model";
import {
  EMPTY_STATE,
  formPrefill,
  prefillReducer,
  type FormPrefill,
  type PrefillState,
} from "./state";

/** React binding of the prefill reducer: the state plus one function per action. */
export interface PrefillStore {
  readonly state: PrefillState;
  readonly formPrefill: (nodeId: string) => FormPrefill;
  readonly setEnabled: (nodeId: string, enabled: boolean) => void;
  readonly setMapping: (nodeId: string, field: string, reference: DataReference) => void;
  readonly clearMapping: (nodeId: string, field: string) => void;
}

export function usePrefill(initialState: PrefillState = EMPTY_STATE): PrefillStore {
  const [state, dispatch] = useReducer(prefillReducer, initialState);

  return {
    state,
    formPrefill: useCallback((nodeId: string) => formPrefill(state, nodeId), [state]),
    setEnabled: useCallback((nodeId: string, enabled: boolean) => {
      dispatch({ type: enabled ? "enable" : "disable", nodeId });
    }, []),
    setMapping: useCallback((nodeId: string, field: string, reference: DataReference) => {
      dispatch({ type: "set", nodeId, field, reference });
    }, []),
    clearMapping: useCallback((nodeId: string, field: string) => {
      dispatch({ type: "clear", nodeId, field });
    }, []),
  };
}
