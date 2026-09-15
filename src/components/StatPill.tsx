import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface StatPillProps {
  label: string;
  value: ReactNode;
  emphasis?: boolean;
}

/**
 * A labelled value chip for showing a speed number under a short caption.
 * Takes a label, a value, and optional emphasis, returns the element.
 */
export function StatPill({ label, value, emphasis = false }: StatPillProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        borderRadius: 1,
        px: 1.5,
        py: 1,
        bgcolor: emphasis ? 'speed.main' : 'background.default',
        color: emphasis ? 'common.white' : 'text.primary',
      }}
    >
      <Typography
        component="span"
        sx={(theme) => ({
          fontSize: '0.75rem',
          fontWeight: 500,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: emphasis ? theme.tokens.emphasisLabelColor : 'text.secondary',
        })}
      >
        {label}
      </Typography>
      <Typography
        component="span"
        sx={{ fontSize: '1.25rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </Typography>
    </Box>
  );
}
