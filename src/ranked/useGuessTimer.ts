import { useEffect, useRef, useState } from 'react';

/** Ranked play gives the player this long to answer each round before it counts as a failure. */
export const GUESS_LIMIT_MS = 5000;

// How often the countdown recomputes the displayed value. Coarse enough to stay cheap, fine enough
// that the fires-at-zero check lands within a tenth of a second of the true deadline.
const TICK_MS = 100;

interface GuessTimerOptions {
  /** True only while a round is actively awaiting an answer; false pauses (and holds) the clock. */
  running: boolean;
  /** Bumps once per new round, restarting the countdown from the full duration. */
  roundKey: number;
  /** Called once, when the clock reaches zero before the player answers. */
  onExpire: () => void;
  durationMs?: number;
}

/**
 * A per-round countdown for ranked play. While `running`, it counts down from `durationMs` and calls
 * `onExpire` exactly once when it hits zero. Pausing (running -> false, e.g. the player answered)
 * holds the readout where it stands; a timeout likewise holds at zero. Every new round (a fresh
 * `roundKey`) restarts the clock at full. Returns whole seconds remaining, for a StreakStat readout.
 */
export function useGuessTimer({
  running,
  roundKey,
  onExpire,
  durationMs = GUESS_LIMIT_MS,
}: GuessTimerOptions): number {
  const total = Math.ceil(durationMs / 1000);
  const [secondsLeft, setSecondsLeft] = useState(total);
  // Kept in a ref so a changing handler never restarts the interval mid-round.
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  // Only a new round resets the clock; pausing leaves the last value on screen until then.
  useEffect(() => {
    setSecondsLeft(total);
  }, [roundKey, total]);

  useEffect(() => {
    if (!running) return; // paused (answered or timed out): hold the current value
    const start = Date.now();
    setSecondsLeft(total);
    const id = setInterval(() => {
      const left = durationMs - (Date.now() - start);
      if (left <= 0) {
        clearInterval(id);
        setSecondsLeft(0);
        onExpireRef.current();
      } else {
        setSecondsLeft(Math.ceil(left / 1000));
      }
    }, TICK_MS);
    return () => clearInterval(id);
  }, [running, roundKey, durationMs]);

  return secondsLeft;
}
