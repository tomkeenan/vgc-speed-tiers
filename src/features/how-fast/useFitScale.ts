import { useLayoutEffect, useState, type RefObject } from 'react';

export interface FitScale {
  /** Largest uniform factor (<= 1) that fits the content in the region. */
  scale: number;
  /** The content's natural (unscaled) width in pixels. */
  width: number;
  /** The content's natural (unscaled) height in pixels. */
  height: number;
}

/**
 * Measures a content element's natural size and the largest uniform scale that fits it inside a
 * region element, re-measuring on either element's resize. Returns scale 1 while disabled.
 * Takes refs to the region and the content plus an enabled flag, returns the fit.
 */
export function useFitScale(
  regionRef: RefObject<HTMLElement | null>,
  contentRef: RefObject<HTMLElement | null>,
  enabled: boolean,
): FitScale {
  const [fit, setFit] = useState<FitScale>({ scale: 1, width: 0, height: 0 });

  useLayoutEffect(() => {
    if (!enabled) {
      setFit({ scale: 1, width: 0, height: 0 });
      return;
    }
    const region = regionRef.current;
    const content = contentRef.current;
    if (!region || !content) return;

    const measure = () => {
      const height = content.offsetHeight;
      const width = content.offsetWidth;
      if (!height || !width) return;
      const scale = Math.min(1, region.clientHeight / height, region.clientWidth / width);
      setFit({ scale, width, height });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(region);
    observer.observe(content);
    return () => observer.disconnect();
  }, [enabled, regionRef, contentRef]);

  return enabled ? fit : { scale: 1, width: 0, height: 0 };
}
