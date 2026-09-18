import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { AuthControl } from './AuthControl';
import { DeckSelector } from './DeckSelector';
import { GearIcon } from './GearIcon';
import { HeaderIconButton } from './HeaderIconButton';
import { LeaderboardIcon } from './LeaderboardIcon';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '../auth/AuthContext';

interface HeaderProps {
  onOpenSettings: () => void;
  onToggleLeaderboard: () => void;
  /** Whether the leaderboard screen is currently open, so the crown reads as active. */
  leaderboardActive: boolean;
  /** Whether the settings dialog is currently open, so the cog reads as active. */
  settingsActive: boolean;
}

/**
 * The app header: title on the left, deck / theme / leaderboard / settings controls on the right.
 * The leaderboard crown only shows when sign-in is configured (ranked is an account feature) and
 * toggles its own screen.
 * Takes onOpenSettings and onToggleLeaderboard handlers plus the leaderboard's open state.
 */
export function Header({
  onOpenSettings,
  onToggleLeaderboard,
  leaderboardActive,
  settingsActive,
}: HeaderProps) {
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
          <HeaderIconButton
            label={t('ranked.leaderboard')}
            active={leaderboardActive}
            onClick={onToggleLeaderboard}
          >
            <LeaderboardIcon />
          </HeaderIconButton>
        )}
        <HeaderIconButton
          label={t('header.settings')}
          active={settingsActive}
          onClick={onOpenSettings}
        >
          <GearIcon />
        </HeaderIconButton>
        <AuthControl />
      </Box>
    </Box>
  );
}
