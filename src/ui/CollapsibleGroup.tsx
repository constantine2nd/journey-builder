import { useId, type ReactNode } from "react";

interface CollapsibleGroupProps {
  label: string;
  /** A short hint next to the label, e.g. "direct". Not part of the button's name. */
  badge?: string | undefined;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}

/**
 * A section with a heading that expands and collapses it (decision D9).
 * Controlled, so a parent can open every group that matches a search.
 * Screen readers hear the heading as a button with its expanded state.
 */
export function CollapsibleGroup({
  label,
  badge,
  expanded,
  onToggle,
  children,
}: CollapsibleGroupProps) {
  const contentId = useId();

  return (
    <section className="collapsible">
      <h3 className="collapsible__heading">
        <button
          type="button"
          className="collapsible__toggle"
          aria-expanded={expanded}
          aria-controls={contentId}
          onClick={onToggle}
        >
          <span className="collapsible__chevron" aria-hidden="true" />
          {label}
        </button>
        {badge && <span className="collapsible__badge">{badge}</span>}
      </h3>
      <div id={contentId} className="collapsible__content" hidden={!expanded}>
        {children}
      </div>
    </section>
  );
}
