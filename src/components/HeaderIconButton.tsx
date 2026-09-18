import type { ComponentProps, ReactNode } from 'react';
import IconButton from '@mui/material/IconButton';

interface HeaderIconButtonProps extends Omit<ComponentProps<typeof IconButton>, 'color'> {
  label: string;
  /** Whether the surface this control opens is currently open. Lights the icon in the primary
   * colour and, by default, reflects the open state to assistive tech via aria-pressed. Menu-style
   * openers can pass their own aria-haspopup / aria-expanded (and aria-pressed={undefined}). */
  active?: boolean;
  children: ReactNode;
}

/**
 * A header control icon button. Renders in the primary colour while the surface it opens is open and
 * the usual text colour otherwise, so the deck, leaderboard, settings and account controls all read
 * the same way. The disabled state greys out with a solid colour dimmed by one element-level opacity
 * so the icon composites as a single layer: MUI's default semi-transparent disabled colour stacks
 * alpha where a glyph's strokes overlap (e.g. the Poke Ball's centre) and darkens those spots. Takes
 * a label, active flag and the icon, forwards any other IconButton props (with sx merged onto the
 * colour rule); returns the element.
 */
export function HeaderIconButton({ label, active = false, children, sx, ...rest }: HeaderIconButtonProps) {
  return (
    <IconButton
      aria-label={label}
      aria-pressed={active}
      sx={[
        {
          color: active ? 'primary.main' : 'text.primary',
          '&.Mui-disabled': { color: active ? 'primary.main' : 'text.primary', opacity: 0.38 },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...rest}
    >
      {children}
    </IconButton>
  );
}
