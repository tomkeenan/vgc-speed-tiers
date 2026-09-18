import type { Celebration } from './celebration';
import { MEDAL_TRIM } from './medals';

const ABOVE_MUI_MODAL_Z_INDEX = 2000;

function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function tierFor(rank: number | null): { particleCount: number; colors?: string[]; grand: boolean } {
  if (rank === 1) {
    return {
      particleCount: 160,
      colors: [MEDAL_TRIM[1], MEDAL_TRIM[2], MEDAL_TRIM[3], '#ffffff'],
      grand: true,
    };
  }
  if (rank === 2) return { particleCount: 110, colors: [MEDAL_TRIM[2], '#ffffff'], grand: false };
  if (rank === 3) return { particleCount: 110, colors: [MEDAL_TRIM[3], '#ffffff'], grand: false };
  if (rank != null) return { particleCount: 90, grand: false };
  return { particleCount: 60, grand: false };
}

/**
 * Fires a celebratory confetti burst for a finished run, scaled and coloured by its placement (a
 * grand gold/silver/bronze shower for 1st, smaller bursts down to a plain best). Loads the confetti
 * library on demand so it never touches the initial bundle, and stays silent under reduced motion.
 */
export async function fireCelebration(celebration: Celebration): Promise<void> {
  if (prefersReducedMotion()) return;
  const confetti = (await import('canvas-confetti')).default;
  const { particleCount, colors, grand } = tierFor(celebration.rank);
  const base = { zIndex: ABOVE_MUI_MODAL_Z_INDEX, colors, origin: { y: 0.35 } };

  if (!grand) {
    confetti({ ...base, particleCount, spread: 75, startVelocity: 45 });
    return;
  }
  confetti({ ...base, particleCount: particleCount * 0.25, spread: 26, startVelocity: 55 });
  confetti({ ...base, particleCount: particleCount * 0.2, spread: 60 });
  confetti({ ...base, particleCount: particleCount * 0.35, spread: 100, decay: 0.91, scalar: 0.8 });
  confetti({ ...base, particleCount: particleCount * 0.2, spread: 120, startVelocity: 45 });
}
