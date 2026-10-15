interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Accessible name, e.g. "Prefill fields for this form". */
  label: string;
}

/** An on/off switch (decision D9), as in the reference panel's "Prefill" header. */
export function Switch({ checked, onChange, label }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      className="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => {
        onChange(!checked);
      }}
    >
      <span className="switch__knob" aria-hidden="true" />
    </button>
  );
}
