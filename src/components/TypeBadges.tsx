interface TypeBadgesProps {
  types: string[];
}

/**
 * A row of type labels for a Pokemon.
 * Takes the list of type names, returns the element.
 */
export function TypeBadges({ types }: TypeBadgesProps) {
  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {types.map((type) => (
        <span
          key={type}
          className="bg-surface-muted text-ink-muted rounded-full px-2.5 py-0.5 text-xs font-semibold"
        >
          {type}
        </span>
      ))}
    </div>
  );
}
