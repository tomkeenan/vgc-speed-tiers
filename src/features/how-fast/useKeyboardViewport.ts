import { useEffect, useState } from 'react';

export interface KeyboardViewport {
  /** Whether the on-screen keyboard is covering part of the layout viewport. */
  open: boolean;
  /** Top of the visible area, in layout-viewport pixels. */
  top: number;
  /** Height of the visible area above the keyboard, in pixels. */
  height: number;
}

const KEYBOARD_MIN_INSET_PX = 120;

/**
 * Tracks the on-screen keyboard via the visualViewport API.
 * Returns whether the keyboard is open plus the visible area's top offset and height.
 */
export function useKeyboardViewport(): KeyboardViewport {
  const [state, setState] = useState<KeyboardViewport>({ open: false, top: 0, height: 0 });

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const covered = window.innerHeight - vv.height - vv.offsetTop;
      setState({ open: covered > KEYBOARD_MIN_INSET_PX, top: vv.offsetTop, height: vv.height });
    };

    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  return state;
}
