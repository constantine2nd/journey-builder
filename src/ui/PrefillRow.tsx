interface PrefillRowProps {
  field: string;
  /** The mapped element's label, e.g. "Form A.email"; undefined when unmapped. */
  mappedTo?: string | undefined;
  /** When prefill is off for the form, rows show but cannot be edited. */
  disabled?: boolean | undefined;
  onPick: () => void;
  onClear: () => void;
}

/**
 * One field of the prefill panel, in the reference format: an unmapped
 * field shows its key with a data icon and opens the picker; a mapped one
 * reads "email: Form A.email" and has a × that clears it.
 */
export function PrefillRow({
  field,
  mappedTo,
  disabled,
  onPick,
  onClear,
}: PrefillRowProps) {
  const mapped = mappedTo !== undefined;

  return (
    <li className={"prefill-row" + (mapped ? " prefill-row--mapped" : "")}>
      <button
        type="button"
        className="prefill-row__main"
        aria-label={mapped ? undefined : `${field}, no prefill configured`}
        disabled={disabled}
        onClick={onPick}
      >
        {!mapped && <DataIcon />}
        {mapped ? `${field}: ${mappedTo}` : field}
      </button>
      {mapped && (
        <button
          type="button"
          className="prefill-row__clear"
          aria-label={`Clear prefill for ${field}`}
          disabled={disabled}
          onClick={onClear}
        >
          ×
        </button>
      )}
    </li>
  );
}

/** The database glyph the reference shows on unmapped rows. */
function DataIcon() {
  return (
    <svg
      className="prefill-row__icon"
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
    >
      <ellipse cx="8" cy="3.5" rx="5.5" ry="2.5" fill="none" stroke="currentColor" />
      <path
        d="M2.5 3.5v9c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5v-9"
        fill="none"
        stroke="currentColor"
      />
      <path
        d="M2.5 8c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5"
        fill="none"
        stroke="currentColor"
      />
    </svg>
  );
}
