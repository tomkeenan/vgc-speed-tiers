import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { SlotNumber } from './SlotNumber';

interface SpeedRevealProps {
  value: number;
  revealed: boolean;
}

/**
 * The "Base Speed" panel shown on a flashcard: masks the value as ??? until revealed,
 * then spins the number in. Takes the base Speed and whether it is revealed, returns the element.
 */
export function SpeedReveal({ value, revealed }: SpeedRevealProps) {
  return (
    <Box sx={{ mt: 1, width: '100%' }}>
      <Box
        sx={{
          bgcolor: 'background.default',
          color: 'text.primary',
          borderRadius: 1,
          px: 2,
          py: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography
          sx={{
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'text.secondary',
          }}
        >
          Base Speed
        </Typography>
        <Typography
          sx={{
            fontSize: '3rem',
            lineHeight: 1,
            fontWeight: 900,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {revealed ? <SlotNumber value={value} /> : '???'}
        </Typography>
      </Box>
    </Box>
  );
}
