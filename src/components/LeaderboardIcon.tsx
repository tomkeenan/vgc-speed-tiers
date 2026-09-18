interface LeaderboardIconProps {
  size?: number;
}

/** A crown glyph (the leaderboard entry point) as an inline SVG that inherits the text color. */
export function LeaderboardIcon({ size = 20 }: LeaderboardIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M3 7l4.5 6L12 5l4.5 8L21 7l-2 12H5L3 7z" />
      <path d="M5 19h14" />
    </svg>
  );
}
