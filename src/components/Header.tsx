import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { DeckSelector } from './DeckSelector';
import { GearIcon } from './GearIcon';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  onOpenSettings: () => void;
}

/**
 * The app header: title on the left, deck / theme / settings controls on the right.
 * Takes an onOpenSettings handler, returns the element.
 */
export function Header({ onOpenSettings }: HeaderProps) {
  const { t } = useTranslation();
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
          {t('app.title')}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
        <DeckSelector />
        <ThemeToggle />
        <IconButton
          aria-label={t('header.settings')}
          onClick={onOpenSettings}
          sx={{ color: 'text.primary' }}
        >
          <GearIcon />
        </IconButton>
      </Box>
    </Box>
  );
}
