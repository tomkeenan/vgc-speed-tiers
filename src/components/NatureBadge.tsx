import Chip from '@mui/material/Chip';

interface NatureBadgeProps {
  nature: 'neutral' | 'positive';
}

/**
 * A small chip marking a contender's Speed nature: neutral-max or +Spd-max.
 * Takes the nature, returns the element.
 */
export function NatureBadge({ nature }: NatureBadgeProps) {
  const positive = nature === 'positive';
  return (
    <Chip
      label={positive ? '+Spd' : 'Neutral'}
      size="small"
      sx={{
        bgcolor: positive ? 'speed.main' : 'background.default',
        color: positive ? 'speed.contrastText' : 'text.secondary',
        fontSize: '0.7rem',
        fontWeight: 600,
        height: 'auto',
        border: positive ? 'none' : '1px solid',
        borderColor: 'divider',
        '& .MuiChip-label': { px: 1, py: 0.25 },
      }}
    />
  );
}
