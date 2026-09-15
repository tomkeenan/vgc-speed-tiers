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
}

const STATE_SX = {
  correct: { borderColor: 'success.main', borderWidth: 2 },
  wrong: { borderColor: 'primary.main', borderWidth: 2 },
} as const;

/**
 * A padded surface panel with consistent rounding and a subtle border. When given an onClick
 * it becomes a keyboard-accessible button via CardActionArea; when given a state it colours the
 * border green (correct) or red (wrong).
 * Takes children plus an optional onClick, aria-label, sx overrides, and state, returns the element.
 */
export function Card({ children, onClick, ariaLabel, sx, state }: CardProps) {
  const content = (
    <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>{children}</CardContent>
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
        state ? STATE_SX[state] : false,
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {onClick ? (
        <CardActionArea onClick={onClick} aria-label={ariaLabel}>
          {content}
        </CardActionArea>
      ) : (
        content
      )}
    </MuiCard>
  );
}
