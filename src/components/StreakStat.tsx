import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface StreakStatProps {
  value: number;
  label: string;
  color: string;
}

/**
 * A single labelled streak counter: the big number above its uppercase label.
 * Takes the value, label, and colour, returns the element.
 */
export function StreakStat({ value, label, color }: StreakStatProps) {
  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography
        sx={{
          color,
          fontWeight: 800,
          fontSize: { xs: '2.5rem', sm: '3rem' },
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </Typography>
      <Typography
        sx={{
          color: 'text.secondary',
          fontSize: '0.75rem',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}
