import type { GraphNode } from "../api/schema";

interface FormListProps {
  /** Form nodes only (decision D8); sorted here by name. */
  nodes: readonly GraphNode[];
  selectedNodeId?: string | undefined;
  onSelect: (nodeId: string) => void;
}

/** The list of forms in the blueprint. Clicking one opens its prefill panel. */
export function FormList({ nodes, selectedNodeId, onSelect }: FormListProps) {
  const sorted = [...nodes].sort((a, b) => a.data.name.localeCompare(b.data.name));

  return (
    <nav className="form-list" aria-label="Forms">
      <h2 className="form-list__title">Forms</h2>
      <ul className="form-list__items">
        {sorted.map((node) => (
          <li key={node.id}>
            <button
              type="button"
              className="form-list__item"
              aria-pressed={node.id === selectedNodeId}
              onClick={() => {
                onSelect(node.id);
              }}
            >
              {node.data.name}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
