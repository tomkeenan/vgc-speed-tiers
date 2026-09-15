import type { ReactNode } from 'react';
import type { SxProps, Theme } from '@mui/material/styles';
import MuiCard from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';

interface CardProps {
  children: ReactNode;
  onClick?: () => void;
  ariaLabel?: string;
  sx?: SxProps<Theme>;
  state?: 'correct' | 'wrong';
  /** Fill the card's height and stretch the content column, so children can bottom-anchor in an
   * equal-height row (used to line up the two Who's Faster? cards regardless of type count). */
  stretch?: boolean;
}

const STATE_SX = {
  correct: { borderColor: 'success.main', borderWidth: 2 },
  wrong: { borderColor: 'primary.main', borderWidth: 2 },
} as const;

const fill = { display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 } as const;

/**
 * A padded surface panel with consistent rounding and a subtle border. When given an onClick
 * it becomes a keyboard-accessible button via CardActionArea; when given a state it colours the
 * border green (correct) or red (wrong); when stretch is set it fills its height so content can
 * bottom-anchor in an equal-height row.
 * Takes children plus an optional onClick, aria-label, sx overrides, state, and stretch flag,
 * returns the element.
 */
export function Card({ children, onClick, ariaLabel, sx, state, stretch }: CardProps) {
  const content = (
    <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 }, ...(stretch ? fill : null) }}>
      {children}
    </CardContent>
  );

  return (
    <MuiCard
      variant="outlined"
      sx={[
        (theme) => ({
          borderRadius: 1,
          boxShadow: theme.tokens.cardShadow,
          transition: theme.transitions.create('border-color', {
            duration: theme.transitions.duration.shorter,
          }),
        }),
        stretch ? { display: 'flex', flexDirection: 'column' } : false,
        state ? STATE_SX[state] : false,
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {onClick ? (
        <CardActionArea onClick={onClick} aria-label={ariaLabel} sx={stretch ? fill : undefined}>
          {content}
        </CardActionArea>
      ) : (
        content
      )}
    </MuiCard>
  );
}
