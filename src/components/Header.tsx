import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { AuthControl } from './AuthControl';
import { DeckSelector } from './DeckSelector';
import { GearIcon } from './GearIcon';
import { LeaderboardIcon } from './LeaderboardIcon';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '../auth/AuthContext';

interface HeaderProps {
  onOpenSettings: () => void;
  onToggleLeaderboard: () => void;
  /** Whether the leaderboard screen is currently open, so the crown reads as active. */
  leaderboardActive: boolean;
}

/**
 * The app header: title on the left, deck / theme / leaderboard / settings controls on the right.
 * The leaderboard crown only shows when sign-in is configured (ranked is an account feature) and
 * toggles its own screen.
 * Takes onOpenSettings and onToggleLeaderboard handlers plus the leaderboard's open state.
 */
export function Header({ onOpenSettings, onToggleLeaderboard, leaderboardActive }: HeaderProps) {
  const { t } = useTranslation();
  const { configured } = useAuth();
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
        {configured && (
          <IconButton
            aria-label={t('ranked.leaderboard')}
            aria-pressed={leaderboardActive}
            onClick={onToggleLeaderboard}
            sx={{ color: leaderboardActive ? 'primary.main' : 'text.primary' }}
          >
            <LeaderboardIcon />
          </IconButton>
        )}
        <IconButton
          aria-label={t('header.settings')}
          onClick={onOpenSettings}
          sx={{ color: 'text.primary' }}
        >
          <GearIcon />
        </IconButton>
        <AuthControl />
      </Box>
    </Box>
  );
}
