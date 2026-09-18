interface MedalIconProps {
  size?: number;
}

/** A rosette medal glyph as an inline SVG that inherits the text colour via `fill`. */
export function MedalIcon({ size = 20 }: MedalIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M9.68 13.69L12 11.93l2.31 1.76-.88-2.85L15.75 9h-2.84L12 6.19 11.09 9H8.25l1.31 1.84-.88 2.85zM20 10c0-4.42-3.58-8-8-8s-8 3.58-8 8c0 2.03.76 3.87 2 5.28V23l6-2 6 2v-7.72c1.24-1.41 2-3.25 2-5.28zm-8-6c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6 2.69-6 6-6zm0 15l-4 1.02v-3.1c1.18.68 2.54 1.08 4 1.08s2.82-.4 4-1.08v3.1L12 19z" />
    </svg>
  );
}
