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
}

/**
 * A padded surface panel with consistent rounding and a subtle border. When given an onClick
 * it becomes a keyboard-accessible button via CardActionArea.
 * Takes children plus an optional onClick, aria-label, and sx overrides, returns the element.
 */
export function Card({ children, onClick, ariaLabel, sx }: CardProps) {
  const content = (
    <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>{children}</CardContent>
  );

  return (
    <MuiCard
      variant="outlined"
      sx={{ borderRadius: '16px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', ...sx }}
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
