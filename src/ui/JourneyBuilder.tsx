import { useMemo, useState } from "react";
import type { BlueprintGraph } from "../api/schema";
import { formOf, indexGraph } from "../graph";
import { stateFromGraph } from "../prefill/expressions";
import type { GroupOrder } from "../prefill/groupOrder";
import type { DataReference } from "../prefill/model";
import {
  describeReference,
  type DataSource,
  type SourceContext,
} from "../prefill/source";
import { usePrefill } from "../prefill/usePrefill";
import { DataPicker } from "./DataPicker";
import { FormList } from "./FormList";
import { PrefillPanel } from "./PrefillPanel";

interface JourneyBuilderProps {
  graph: BlueprintGraph;
  /** The active data sources, in display order (decision D4). */
  sources: readonly DataSource[];
  /** How the picker orders groups (decision D5). */
  groupOrder?: GroupOrder | undefined;
}

/**
 * The loaded app: the form list on the left, the selected form's prefill
 * panel on the right, and the picker when a row is being configured.
 * Owns the selection, the field being edited, and the prefill state.
 */
export function JourneyBuilder({ graph, sources, groupOrder }: JourneyBuilderProps) {
  const index = useMemo(() => indexGraph(graph), [graph]);
  const prefill = usePrefill(useMemo(() => stateFromGraph(graph), [graph]));
  const [selectedNodeId, setSelectedNodeId] = useState<string>();
  const [editingField, setEditingField] = useState<string>();

  const selectedNode = selectedNodeId ? index.nodesById.get(selectedNodeId) : undefined;
  const selectedForm = selectedNode && formOf(index, selectedNode);

  // Stable while the selection is, so sources are not re-queried every render.
  const context = useMemo<SourceContext | undefined>(
    () => selectedNode && { index, targetNode: selectedNode },
    [index, selectedNode],
  );

  const describe = (reference: DataReference) =>
    context ? describeReference(sources, reference, context) : "";

  const selectForm = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    setEditingField(undefined);
  };

  return (
    <main className="app">
      <header className="app__header">
        <h1>{graph.name}</h1>
      </header>

      <div className="app__body">
        <FormList
          nodes={index.formNodes}
          selectedNodeId={selectedNodeId}
          onSelect={selectForm}
        />

        <div className="app__detail">
          {selectedNode && selectedForm ? (
            <PrefillPanel
              node={selectedNode}
              form={selectedForm}
              prefill={prefill.formPrefill(selectedNode.id)}
              describe={describe}
              onToggle={(enabled) => {
                prefill.setEnabled(selectedNode.id, enabled);
              }}
              onPick={setEditingField}
              onClear={(field) => {
                prefill.clearMapping(selectedNode.id, field);
              }}
            />
          ) : (
            <p className="app__hint">Select a form to configure its prefill.</p>
          )}
        </div>
      </div>

      {selectedNode && context && editingField !== undefined && (
        <DataPicker
          field={editingField}
          sources={sources}
          context={context}
          groupOrder={groupOrder}
          onSelect={(reference) => {
            prefill.setMapping(selectedNode.id, editingField, reference);
            setEditingField(undefined);
          }}
          onClose={() => {
            setEditingField(undefined);
          }}
        />
      )}
    </main>
  );
}
