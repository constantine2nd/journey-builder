import { useMemo, useState } from "react";
import type { BlueprintGraph } from "../api/schema";
import { formOf, indexGraph } from "../graph";
import { stateFromGraph } from "../prefill/expressions";
import type { DataReference } from "../prefill/model";
import {
  describeReference,
  type DataSource,
  type SourceContext,
} from "../prefill/source";
import { usePrefill } from "../prefill/usePrefill";
import { FormList } from "./FormList";
import { PrefillPanel } from "./PrefillPanel";

interface JourneyBuilderProps {
  graph: BlueprintGraph;
  /** The active data sources, in display order (decision D4). */
  sources: readonly DataSource[];
}

/**
 * The loaded app: the form list on the left, the selected form's prefill
 * panel on the right. Owns the selection and the prefill state.
 */
export function JourneyBuilder({ graph, sources }: JourneyBuilderProps) {
  const index = useMemo(() => indexGraph(graph), [graph]);
  const prefill = usePrefill(useMemo(() => stateFromGraph(graph), [graph]));
  const [selectedNodeId, setSelectedNodeId] = useState<string>();

  const selectedNode = selectedNodeId ? index.nodesById.get(selectedNodeId) : undefined;
  const selectedForm = selectedNode && formOf(index, selectedNode);

  // Stable while the selection is, so sources are not re-queried every render.
  const context = useMemo<SourceContext | undefined>(
    () => selectedNode && { index, targetNode: selectedNode },
    [index, selectedNode],
  );

  const describe = (reference: DataReference) =>
    context ? describeReference(sources, reference, context) : "";

  return (
    <main className="app">
      <header className="app__header">
        <h1>{graph.name}</h1>
      </header>

      <div className="app__body">
        <FormList
          nodes={index.formNodes}
          selectedNodeId={selectedNodeId}
          onSelect={setSelectedNodeId}
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
              onPick={() => undefined}
              onClear={(field) => {
                prefill.clearMapping(selectedNode.id, field);
              }}
            />
          ) : (
            <p className="app__hint">Select a form to configure its prefill.</p>
          )}
        </div>
      </div>
    </main>
  );
}
