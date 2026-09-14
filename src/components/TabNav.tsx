interface Tab<T extends string> {
  key: T;
  label: string;
}

interface TabNavProps<T extends string> {
  tabs: Tab<T>[];
  active: T;
  onChange: (key: T) => void;
}

/**
 * A horizontal tab bar for switching between features.
 * Takes the tab list, the active key, and an onChange handler, returns the element.
 */
export function TabNav<T extends string>({ tabs, active, onChange }: TabNavProps<T>) {
  return (
    <nav
      className="border-ink/10 bg-surface flex gap-1 rounded-2xl border p-1"
      aria-label="Features"
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          aria-current={active === tab.key ? 'page' : undefined}
          onClick={() => onChange(tab.key)}
          className={`flex-1 rounded-xl px-2 py-2.5 text-sm font-semibold transition-colors ${
            active === tab.key
              ? 'bg-ink text-white'
              : 'text-ink-muted hover:bg-surface-muted bg-transparent'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
