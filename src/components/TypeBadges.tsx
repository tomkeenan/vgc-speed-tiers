interface TypeBadgesProps {
  types: string[];
}

/** Official-style background color per Pokemon type, keyed by lowercase name. */
const TYPE_COLORS: Record<string, string> = {
  normal: '#a8a77a',
  fire: '#ee8130',
  water: '#6390f0',
  electric: '#f7d02c',
  grass: '#7ac74c',
  ice: '#96d9d6',
  fighting: '#c22e28',
  poison: '#a33ea1',
  ground: '#e2bf65',
  flying: '#a98ff3',
  psychic: '#f95587',
  bug: '#a6b91a',
  rock: '#b6a136',
  ghost: '#735797',
  dragon: '#6f35fc',
  dark: '#705746',
  steel: '#b7b7ce',
  fairy: '#d685ad',
};

const FALLBACK = '#71717a';

/** Picks black or white text for a hex background using a YIQ brightness threshold. */
function textColor(bg: string): string {
  const r = parseInt(bg.slice(1, 3), 16);
  const g = parseInt(bg.slice(3, 5), 16);
  const b = parseInt(bg.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 >= 140 ? '#18181b' : '#ffffff';
}

/**
 * A row of type labels for a Pokemon, colored per its in-game type.
 * Takes the list of type names, returns the element.
 */
export function TypeBadges({ types }: TypeBadgesProps) {
  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {types.map((type) => {
        const bg = TYPE_COLORS[type.toLowerCase()] ?? FALLBACK;
        return (
          <span
            key={type}
            style={{ backgroundColor: bg, color: textColor(bg) }}
            className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
          >
            {type}
          </span>
        );
      })}
    </div>
  );
}
