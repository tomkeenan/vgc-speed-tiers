import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import type { MyStanding } from './api';

interface RankedPanelProps {
  /** Whether Google sign-in is configured for this build; the panel renders nothing when not. */
  configured: boolean;
  /** Whether a player is signed in; ranked play is gated behind this. */
  signedIn: boolean;
  ranked: boolean;
  onRankedChange: (ranked: boolean) => void;
  /** The player's standing from their last submitted ranked run, shown as feedback. */
  standing: MyStanding | null;
}

/**
 * The ranked control block for a game: a toggle that switches ranked play on and the player's
 * standing after a ranked run. Ranked play needs a signed-in player, so when signed out the toggle
 * is disabled with a prompt to sign in from the account menu. The leaderboard itself opens from the
 * header crown. Renders nothing when sign-in is not configured for the build.
 */
export function RankedPanel({
  configured,
  signedIn,
  ranked,
  onRankedChange,
  standing,
}: RankedPanelProps) {
  const { t } = useTranslation();

  if (!configured) return null;

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: ranked ? 'primary.main' : 'divider',
        borderRadius: 1,
        px: 2,
        py: 1.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 600 }}>{t('ranked.title')}</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {signedIn ? t('ranked.description') : t('ranked.signInPrompt')}
          </Typography>
        </Box>
        <Switch
          checked={ranked}
          disabled={!signedIn}
          onChange={(e) => onRankedChange(e.target.checked)}
          slotProps={{ input: { 'aria-label': t('ranked.title') } }}
          sx={{ flexShrink: 0 }}
        />
      </Box>

      {standing && (
        <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600 }}>
          {t('ranked.yourStanding', { rank: standing.rank, streak: standing.streak })}
        </Typography>
      )}
    </Box>
  );
}
