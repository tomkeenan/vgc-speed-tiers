import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { getMeta } from '../lib/data';
import { GearIcon } from './GearIcon';

interface HeaderProps {
  onOpenSettings: () => void;
}

/**
 * The app header: title and subtitle on the left, a settings button on the right.
 * Takes an onOpenSettings handler, returns the element.
 */
export function Header({ onOpenSettings }: HeaderProps) {
  const meta = getMeta();

  return (
    <Box
      component="header"
      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: 0 }}>
        <Typography
          component="h1"
          sx={{ fontSize: '1.5rem', fontWeight: 700, color: 'text.primary' }}
        >
          VGC Speed Tiers
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
          Learn Champions-format Speed at level 50 - {meta.count} Pokemon.
        </Typography>
      </Box>

      <IconButton
        aria-label="Settings"
        onClick={onOpenSettings}
        sx={{ flexShrink: 0, color: 'text.primary' }}
      >
        <GearIcon />
      </IconButton>
    </Box>
  );
}
