interface StepperProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
}

/**
 * A labelled numeric stepper with decrement/increment buttons, clamped to a range.
 * Takes a label, value, min, max, onChange, and optional value formatter, returns the element.
 */
export function Stepper({ label, value, min, max, onChange, format }: StepperProps) {
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  const display = format ? format(value) : String(value);

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-ink-muted text-sm font-semibold">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          disabled={value <= min}
          onClick={() => onChange(clamp(value - 1))}
          className="border-ink/10 bg-surface text-ink hover:bg-surface-muted h-10 w-10 shrink-0 rounded-xl border text-xl font-bold transition-colors disabled:opacity-40"
        >
          -
        </button>
        <span className="text-ink flex-1 text-center text-base font-bold tabular-nums">
          {display}
        </span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          disabled={value >= max}
          onClick={() => onChange(clamp(value + 1))}
          className="border-ink/10 bg-surface text-ink hover:bg-surface-muted h-10 w-10 shrink-0 rounded-xl border text-xl font-bold transition-colors disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  );
}
