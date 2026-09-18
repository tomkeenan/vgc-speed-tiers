import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { AccountMenu } from './AccountMenu';
import { DeckSelector } from './DeckSelector';
import { ModeSwitch } from './ModeSwitch';
import { useAuth } from '../auth/AuthContext';

interface HeaderProps {
  onOpenSettings: () => void;
  /** Whether the app is in ranked mode; drives the mode switch and hides the deck selector. */
  ranked: boolean;
  onRankedChange: (ranked: boolean) => void;
}

/**
 * The app header: title on the left, and the Practice/Ranked switch, deck selector and account menu
 * on the right. The mode switch only renders when sign-in is configured, and the deck selector is
 * greyed out in ranked (which always plays the full roster). Takes onOpenSettings and the ranked mode
 * plus its change handler; returns the element.
 */
export function Header({ onOpenSettings, ranked, onRankedChange }: HeaderProps) {
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
        <DeckSelector disabled={ranked} />
        <AccountMenu onOpenSettings={onOpenSettings} />
      </Box>
    </Box>
  );
}
