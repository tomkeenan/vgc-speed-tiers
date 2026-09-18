import { useEffect } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Button } from '../components/Button';
import { MedalIcon } from '../components/MedalIcon';
import { StarIcon } from '../components/StarIcon';
import { TrophyIcon } from '../components/TrophyIcon';
import type { BoardKey } from '../../worker/boards';
import type { Celebration } from './celebration';
import { fireCelebration } from './confetti';
import { MEDAL_TRIM } from './medals';

interface CelebrationDialogProps {
  /** The achievement to celebrate; the dialog is open whenever this is non-null. */
  celebration: Celebration | null;
  onClose: () => void;
  /** Opens the leaderboard on the given board; only offered for a leaderboard (ranked) best. */
  onViewLeaderboard?: (board: BoardKey) => void;
}

type Variant = 'rank1' | 'rank2' | 'rank3' | 'top' | 'pb';

type BodyKey = `ranked.celebration.${
  | 'rank1Body'
  | 'rank2Body'
  | 'rank3Body'
  | 'topBody'
  | 'pbBody'
  | 'practiceBody'}`;

function variantFor(rank: number | null): Variant {
  if (rank === 1) return 'rank1';
  if (rank === 2) return 'rank2';
  if (rank === 3) return 'rank3';
  if (rank != null) return 'top';
  return 'pb';
}

/**
 * Celebrates a finished run that set a personal best or placed on the leaderboard. The podium places
 * (1st/2nd/3rd) each get a gold/silver/bronze trophy and their own line; a top-ten place gets a medal;
 * a plain best gets a trophy. A leaderboard best offers View leaderboard with Continue playing beneath
 * it; a practice best just continues.
 */
export function CelebrationDialog({ celebration, onClose, onViewLeaderboard }: CelebrationDialogProps) {
  const { t } = useTranslation();
  const streak = celebration?.streak ?? 0;
  const rank = celebration?.rank ?? null;
  const board = celebration?.board ?? null;
  const variant = variantFor(rank);

  useEffect(() => {
    if (celebration) void fireCelebration(celebration).catch(() => {});
  }, [celebration]);

  const practiceBest = variant === 'pb' && board == null;
  const iconColor =
    variant === 'rank1'
      ? MEDAL_TRIM[1]
      : variant === 'rank2'
        ? MEDAL_TRIM[2]
        : variant === 'rank3'
          ? MEDAL_TRIM[3]
          : practiceBest
            ? 'gold.main'
            : 'primary.main';

  // Returns the body's key and values (not a resolved string) so <Trans> keeps the <strong> markup.
  const heading = (): { title: string; bodyKey: BodyKey; values: Record<string, number> } => {
    switch (variant) {
      case 'rank1':
        return { title: t('ranked.celebration.rank1Title'), bodyKey: 'ranked.celebration.rank1Body', values: { streak } };
      case 'rank2':
        return { title: t('ranked.celebration.rank2Title'), bodyKey: 'ranked.celebration.rank2Body', values: { streak } };
      case 'rank3':
        return { title: t('ranked.celebration.rank3Title'), bodyKey: 'ranked.celebration.rank3Body', values: { streak } };
      case 'top':
        return { title: t('ranked.celebration.topTitle'), bodyKey: 'ranked.celebration.topBody', values: { streak, rank: rank ?? 0 } };
      default:
        return board != null
          ? { title: t('ranked.celebration.pbTitle'), bodyKey: 'ranked.celebration.pbBody', values: { streak } }
          : { title: t('ranked.celebration.practiceTitle'), bodyKey: 'ranked.celebration.practiceBody', values: { streak } };
    }
  };
  const { title, bodyKey, values } = heading();

  const viewLeaderboard = () => {
    if (board) onViewLeaderboard?.(board);
    onClose();
  };

  return (
    <Dialog open={celebration !== null} onClose={onClose} maxWidth="xs" fullWidth>
      {celebration !== null && (
        <>
          <DialogContent sx={{ pt: 4, pb: 2 }}>
            <Stack spacing={2} alignItems="center" sx={{ textAlign: 'center' }}>
              <Box sx={{ color: iconColor }}>
                {practiceBest ? (
                  <StarIcon size={56} />
                ) : variant === 'top' ? (
                  <MedalIcon size={56} />
                ) : (
                  <TrophyIcon size={56} />
                )}
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                {title}
              </Typography>
              <Typography sx={{ color: 'text.secondary' }}>
                <Trans
                  i18nKey={bodyKey}
                  values={values}
                  components={{
                    strong: (
                      <Box component="strong" sx={{ color: 'gold.main', fontWeight: 700 }} />
                    ),
                  }}
                />
              </Typography>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
            {board ? (
              <Stack spacing={1.5} alignItems="center">
                <Button onClick={viewLeaderboard}>
                  {t('ranked.celebration.viewLeaderboard')}
                </Button>
                <Link
                  component="button"
                  underline="none"
                  onClick={onClose}
                  sx={{ color: 'text.secondary' }}
                >
                  {t('ranked.celebration.dismiss')}
                </Link>
              </Stack>
            ) : (
              <Button onClick={onClose}>{t('ranked.celebration.dismiss')}</Button>
            )}
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
