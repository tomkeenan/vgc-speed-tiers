import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

interface StepperProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
}

const buttonSx = {
  width: 40,
  height: 40,
  flexShrink: 0,
  borderRadius: '12px',
  border: '1px solid',
  borderColor: 'divider',
  bgcolor: 'background.paper',
  color: 'text.primary',
  fontSize: '1.25rem',
  fontWeight: 700,
  '&:hover': { bgcolor: 'background.default' },
} as const;

/**
 * A labelled numeric stepper with decrement/increment buttons, clamped to a range.
 * Takes a label, value, min, max, onChange, and optional value formatter, returns the element.
 */
export function Stepper({ label, value, min, max, onChange, format }: StepperProps) {
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  const display = format ? format(value) : String(value);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
      <Typography
        component="span"
        sx={{ fontSize: '0.875rem', fontWeight: 600, color: 'text.secondary' }}
      >
        {label}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <IconButton
          aria-label={`Decrease ${label}`}
          disabled={value <= min}
          onClick={() => onChange(clamp(value - 1))}
          sx={buttonSx}
        >
          -
        </IconButton>
        <Typography
          component="span"
          sx={{
            flex: 1,
            textAlign: 'center',
            fontSize: '1rem',
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            color: 'text.primary',
          }}
        >
          {display}
        </Typography>
        <IconButton
          aria-label={`Increase ${label}`}
          disabled={value >= max}
          onClick={() => onChange(clamp(value + 1))}
          sx={buttonSx}
        >
          +
        </IconButton>
      </Box>
    </Box>
  );
}
