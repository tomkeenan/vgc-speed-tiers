import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';

const SPINS = 3;
export const SLOT_BASE_MS = 650;
export const SLOT_STAGGER_MS = 130;

/**
 * How long the slot spin runs for a value, from first reel start to the last reel settling.
 * Takes the value, returns milliseconds.
 */
export function slotSpinMs(value: number): number {
  return SLOT_BASE_MS + (String(value).length - 1) * SLOT_STAGGER_MS;
}

const srOnly = {
  position: 'absolute',
  width: 1,
  height: 1,
  p: 0,
  m: '-1px',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
} as const;

/** A single 0-9 reel that spins from 0 and lands on its target digit. */
function Reel({ digit, order }: { digit: number; order: number }) {
  const [spun, setSpun] = useState(false);

  useEffect(() => {
    if (typeof requestAnimationFrame === 'undefined') {
      setSpun(true);
      return;
    }
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setSpun(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, []);

  const target = SPINS * 10 + digit;
  const cells = Array.from({ length: target + 1 }, (_, i) => i % 10);

  return (
    <Box sx={{ height: '1em', lineHeight: 1, overflow: 'hidden', display: 'inline-block' }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          transform: spun ? `translateY(-${target}em)` : 'translateY(0)',
          transition: `transform ${SLOT_BASE_MS + order * SLOT_STAGGER_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`,
        }}
      >
        {cells.map((n, i) => (
          <Box
            key={i}
            sx={{ height: '1em', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {n}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

/**
 * A whole number that spins into place like a slot machine, one reel per digit, settling
 * left-to-right. Takes a non-negative integer value, returns the element.
 */
export function SlotNumber({ value }: { value: number }) {
  const digits = String(value).split('');
  return (
    <Box component="span" sx={{ display: 'inline-flex', fontVariantNumeric: 'tabular-nums' }}>
      <Box component="span" sx={srOnly}>
        {value}
      </Box>
      <Box component="span" aria-hidden sx={{ display: 'inline-flex' }}>
        {digits.map((d, i) => (
          <Reel key={`${value}-${i}`} digit={Number(d)} order={i} />
        ))}
      </Box>
    </Box>
  );
}
