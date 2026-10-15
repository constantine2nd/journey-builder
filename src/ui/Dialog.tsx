import { useEffect, useId, useRef, useState, type ReactNode } from "react";

interface DialogProps {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  /** Extra class for the panel, e.g. to make a wide dialog. */
  className?: string;
}

/**
 * A generic modal dialog (decision D9): overlay, titled panel, close button,
 * optional footer. Escape, the × button and a click on the overlay close it.
 * Focus moves into the panel on open and returns to the opener on close.
 * Knows nothing about prefill.
 */
export function Dialog({ title, onClose, children, footer, className }: DialogProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  // Captured once, at first render, before anything inside the dialog takes focus.
  const [opener] = useState(() => document.activeElement);

  useEffect(() => {
    const panel = panelRef.current;
    if (panel && !panel.contains(document.activeElement)) panel.focus();

    return () => {
      if (opener instanceof HTMLElement) opener.focus();
    };
  }, [opener]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="dialog-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className={"dialog" + (className ? ` ${className}` : "")}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <header className="dialog__header">
          <h2 id={titleId} className="dialog__title">
            {title}
          </h2>
          <button
            type="button"
            className="dialog__close"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </header>
        <div className="dialog__body">{children}</div>
        {footer && <footer className="dialog__footer">{footer}</footer>}
      </div>
    </div>
  );
}
