interface Option<T extends string> {
  label: string;
  value: T;
}

interface SegmentedControlProps<T extends string> {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}

/**
 * A labelled single-choice control rendered as a row of segments.
 * Takes a label, options, the selected value, and an onChange handler, returns the element.
 */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-ink-muted text-sm font-semibold">{label}</span>
      <div className="border-ink/10 flex overflow-hidden rounded-xl border">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={`flex-1 px-3 py-2 text-sm font-semibold transition-colors ${
              value === option.value
                ? 'bg-ink text-white'
                : 'bg-surface text-ink hover:bg-surface-muted'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
