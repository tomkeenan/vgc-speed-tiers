import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { AccountMenu } from './AccountMenu';
import { DeckSelector } from './DeckSelector';
import { HeaderIconButton } from './HeaderIconButton';
import { LeaderboardIcon } from './LeaderboardIcon';
import { useAuth } from '../auth/AuthContext';

interface HeaderProps {
  onOpenSettings: () => void;
  onToggleLeaderboard: () => void;
  /** Whether the leaderboard screen is currently open, so the crown reads as active. */
  leaderboardActive: boolean;
}

/**
 * The app header: title on the left, and the deck selector, leaderboard crown and account menu on the
 * right. The crown only renders when sign-in is configured. Takes onOpenSettings and
 * onToggleLeaderboard handlers plus the leaderboard's open state; returns the element.
 */
export function Header({
  onOpenSettings,
  onToggleLeaderboard,
  leaderboardActive,
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
        {configured && (
          <HeaderIconButton
            label={t('ranked.leaderboard')}
            active={leaderboardActive}
            onClick={onToggleLeaderboard}
          >
            <LeaderboardIcon />
          </HeaderIconButton>
        )}
        <AccountMenu onOpenSettings={onOpenSettings} />
      </Box>
    </Box>
  );
}
