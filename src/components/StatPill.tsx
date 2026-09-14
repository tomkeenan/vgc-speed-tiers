interface StatPillProps {
  label: string;
  value: string | number;
  emphasis?: boolean;
}

/**
 * A labelled value chip for showing a speed number under a short caption.
 * Takes a label, a value, and optional emphasis, returns the element.
 */
export function StatPill({ label, value, emphasis = false }: StatPillProps) {
  return (
    <div
      className={`flex flex-col items-center rounded-xl px-3 py-2 ${
        emphasis ? 'bg-brand text-white' : 'bg-surface-muted text-ink'
      }`}
    >
      <span
        className={`text-xs font-medium tracking-wide uppercase ${
          emphasis ? 'text-white/80' : 'text-ink-muted'
        }`}
      >
        {label}
      </span>
      <span className="text-xl font-bold tabular-nums">{value}</span>
    </div>
  );
}
