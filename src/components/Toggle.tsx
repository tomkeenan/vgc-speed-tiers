interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/**
 * A labelled on/off switch.
 * Takes a label, the checked state, and an onChange handler, returns the element.
 */
export function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <label className="border-ink/10 bg-surface flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3">
      <span className="text-ink text-sm font-semibold">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-ink' : 'bg-ink/20'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </label>
  );
}
