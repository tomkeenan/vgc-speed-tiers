import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { AccountMenu } from './AccountMenu';
import { DeckSelector } from './DeckSelector';
import { HeaderIconButton } from './HeaderIconButton';
import { LeaderboardIcon } from './LeaderboardIcon';
import { ModeSwitch } from './ModeSwitch';
import { useAuth } from '../auth/AuthContext';

interface HeaderProps {
  onOpenSettings: () => void;
  onToggleLeaderboard: () => void;
  /** Whether the leaderboard screen is currently open, so the crown reads as active. */
  leaderboardActive: boolean;
  /** Whether the app is in ranked mode; drives the mode switch and hides the deck selector. */
  ranked: boolean;
  onRankedChange: (ranked: boolean) => void;
}

/**
 * The app header: title on the left, and the Practice/Ranked switch, deck selector, leaderboard crown
 * and account menu on the right. The mode switch and crown only render when sign-in is configured, and
 * the deck selector is hidden in ranked (which always plays the full roster). Takes onOpenSettings and
 * onToggleLeaderboard handlers, the leaderboard's open state, and the ranked mode plus its change
 * handler; returns the element.
 */
export function Header({
  onOpenSettings,
  onToggleLeaderboard,
  leaderboardActive,
  ranked,
  onRankedChange,
}: HeaderProps) {
  const { t } = useTranslation();
  const { configured, user } = useAuth();
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
        {configured && (
          <ModeSwitch ranked={ranked} onChange={onRankedChange} signedIn={Boolean(user)} />
        )}
        {!ranked && <DeckSelector />}
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
