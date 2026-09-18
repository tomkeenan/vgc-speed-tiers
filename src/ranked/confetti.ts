import type { Celebration } from './celebration';
import { MEDAL_TRIM } from './medals';

const ABOVE_MUI_MODAL_Z_INDEX = 2000;

function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function tierFor(rank: number | null): { particleCount: number; colors?: string[] } {
  if (rank === 1) {
    return { particleCount: 160, colors: [MEDAL_TRIM[1], MEDAL_TRIM[2], MEDAL_TRIM[3], '#ffffff'] };
  }
  if (rank === 2) return { particleCount: 120, colors: [MEDAL_TRIM[2], '#ffffff'] };
  if (rank === 3) return { particleCount: 120, colors: [MEDAL_TRIM[3], '#ffffff'] };
  if (rank != null) return { particleCount: 100 };
  return { particleCount: 80 };
}

/**
 * Fires a celebratory confetti burst for a finished run, scaled and coloured by its placement (a
 * fuller gold/silver/bronze shower for 1st, smaller bursts down to a plain best). Uses the layered
 * "realistic look" pattern: several overlapping bursts from just below centre, mixing spreads and
 * velocities so the pieces fill the screen naturally. Loads the confetti library on demand so it
 * never touches the initial bundle, and stays silent under reduced motion.
 */
export async function fireCelebration(celebration: Celebration): Promise<void> {
  if (prefersReducedMotion()) return;
  const confetti = (await import('canvas-confetti')).default;
  const { particleCount, colors } = tierFor(celebration.rank);
  const base = { zIndex: ABOVE_MUI_MODAL_Z_INDEX, colors, origin: { y: 0.7 } };
  const fire = (ratio: number, opts: Record<string, number>) =>
    confetti({ ...base, ...opts, particleCount: Math.floor(particleCount * ratio) });

  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
}
