interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  /** Accessible name; also the placeholder. */
  label: string;
  autoFocus?: boolean;
}

/** A search field with an accessible name (decision D9). */
export function SearchBox({ value, onChange, label, autoFocus }: SearchBoxProps) {
  return (
    <input
      type="search"
      className="search-box"
      value={value}
      onChange={(event) => {
        onChange(event.target.value);
      }}
      placeholder={label}
      aria-label={label}
      autoFocus={autoFocus}
    />
  );
}
