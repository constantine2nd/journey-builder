import type { FormDefinition, GraphNode } from "../api/schema";
import { prefillableFields } from "../prefill/fields";
import type { DataReference } from "../prefill/model";
import type { FormPrefill } from "../prefill/state";
import { PrefillRow } from "./PrefillRow";
import { Switch } from "./Switch";

interface PrefillPanelProps {
  node: GraphNode;
  form: FormDefinition;
  prefill: FormPrefill;
  /** Turns a stored reference into its label; provided by the active sources. */
  describe: (reference: DataReference) => string;
  onToggle: (enabled: boolean) => void;
  onPick: (field: string) => void;
  onClear: (field: string) => void;
}

/**
 * The reference's prefill panel for one form: a header with the on/off
 * switch, then one row per prefillable field.
 */
export function PrefillPanel({
  node,
  form,
  prefill,
  describe,
  onToggle,
  onPick,
  onClear,
}: PrefillPanelProps) {
  return (
    <section className="prefill-panel" aria-label={`Prefill for ${node.data.name}`}>
      <header className="prefill-panel__header">
        <div>
          <h2 className="prefill-panel__title">Prefill</h2>
          <p className="prefill-panel__subtitle">Prefill fields for this form</p>
        </div>
        <Switch
          checked={prefill.enabled}
          onChange={onToggle}
          label={`Prefill fields for ${node.data.name}`}
        />
      </header>

      <ul className="prefill-panel__rows">
        {prefillableFields(form).map((field) => {
          const reference = prefill.mappings[field];
          return (
            <PrefillRow
              key={field}
              field={field}
              mappedTo={reference && describe(reference)}
              disabled={!prefill.enabled}
              onPick={() => {
                onPick(field);
              }}
              onClear={() => {
                onClear(field);
              }}
            />
          );
        })}
      </ul>
    </section>
  );
}
