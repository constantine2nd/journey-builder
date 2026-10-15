import { useMemo, useState } from "react";
import { orderGroups, type GroupOrder } from "../prefill/groupOrder";
import { referenceKey, type DataReference } from "../prefill/model";
import {
  collectGroups,
  type DataElement,
  type DataSource,
  type SourceContext,
  type SourcedGroup,
} from "../prefill/source";
import { CollapsibleGroup } from "./CollapsibleGroup";
import { Dialog } from "./Dialog";
import { SearchBox } from "./SearchBox";

interface DataPickerProps {
  /** The field being configured, e.g. "email". */
  field: string;
  sources: readonly DataSource[];
  context: SourceContext;
  groupOrder?: GroupOrder | undefined;
  onSelect: (reference: DataReference) => void;
  onClose: () => void;
}

interface Highlighted {
  group: SourcedGroup;
  element: DataElement;
}

/**
 * The reference's "Select data element to map" dialog: "Available data"
 * with a search box and a collapsible tree on the left, the highlighted
 * element's details on the right, Cancel and Select below. It renders
 * whatever groups the active sources return and never knows what a source is.
 */
export function DataPicker({
  field,
  sources,
  context,
  groupOrder,
  onSelect,
  onClose,
}: DataPickerProps) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const [highlighted, setHighlighted] = useState<Highlighted>();

  const groups = useMemo(
    () => orderGroups(collectGroups(sources, context), groupOrder),
    [sources, context, groupOrder],
  );

  const searching = query.trim() !== "";
  const visible = useMemo(() => filterGroups(groups, query), [groups, query]);

  const isExpanded = (group: SourcedGroup) => searching || expanded.has(group.key);
  const toggle = (group: SourcedGroup) => {
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(group.key)) next.delete(group.key);
      else next.add(group.key);
      return next;
    });
  };

  const isHighlighted = (element: DataElement) =>
    highlighted !== undefined &&
    referenceKey(highlighted.element.reference) === referenceKey(element.reference);

  return (
    <Dialog
      title="Select data element to map"
      onClose={onClose}
      className="dialog--wide"
      footer={
        <>
          <button type="button" className="button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="button button--primary"
            disabled={!highlighted}
            onClick={() => {
              if (highlighted) onSelect(highlighted.element.reference);
            }}
          >
            Select
          </button>
        </>
      }
    >
      <div className="picker">
        <div className="picker__tree">
          <h3 className="picker__heading">Available data</h3>
          <p className="picker__field">
            For field <strong>{field}</strong>
          </p>
          <SearchBox value={query} onChange={setQuery} label="Search" autoFocus />

          {visible.length === 0 ? (
            <p className="picker__empty">No matching data elements.</p>
          ) : (
            visible.map((group) => (
              <CollapsibleGroup
                key={group.key}
                label={group.label}
                badge={group.badge}
                expanded={isExpanded(group)}
                onToggle={() => {
                  toggle(group);
                }}
              >
                <ul className="picker__elements">
                  {group.elements.map((element) => (
                    <li key={referenceKey(element.reference)}>
                      <button
                        type="button"
                        className="picker__element"
                        aria-pressed={isHighlighted(element)}
                        onClick={() => {
                          setHighlighted({ group, element });
                        }}
                      >
                        {element.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </CollapsibleGroup>
            ))
          )}
        </div>

        <aside className="picker__detail" aria-label="Selected element">
          {highlighted ? (
            <dl className="picker__details">
              <dt>Element</dt>
              <dd>{highlighted.element.label}</dd>
              <dt>Group</dt>
              <dd>{highlighted.group.label}</dd>
              <dt>Source</dt>
              <dd>{sourceLabel(sources, highlighted.group.sourceId)}</dd>
              <dt>Kind</dt>
              <dd>{highlighted.element.reference.kind}</dd>
            </dl>
          ) : (
            <p className="picker__placeholder">
              Highlight an element to see its details.
            </p>
          )}
        </aside>
      </div>
    </Dialog>
  );
}

/** Groups whose label or any element label contains the query, with only the matching elements. */
function filterGroups(groups: readonly SourcedGroup[], query: string): SourcedGroup[] {
  const needle = query.trim().toLowerCase();
  if (needle === "") return [...groups];

  return groups.flatMap((group) => {
    if (group.label.toLowerCase().includes(needle)) return [group];
    const elements = group.elements.filter((element) =>
      element.label.toLowerCase().includes(needle),
    );
    return elements.length > 0 ? [{ ...group, elements }] : [];
  });
}

function sourceLabel(sources: readonly DataSource[], sourceId: string): string {
  return sources.find((source) => source.id === sourceId)?.label ?? sourceId;
}
