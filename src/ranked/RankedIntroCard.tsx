import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { SxProps, Theme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

interface RankedIntroCardProps {
  /** The game's play layout, rendered invisibly behind the intro so it reserves the exact footprint
   * the game occupies once started; toggling ranked on then never shrinks the surface. */
  footprint: ReactNode;
  /** Width of the visible intro card, matching a single play card (an sx `width` value). */
  cardSx?: SxProps<Theme>;
  onStart: () => void;
}

/**
 * The single centered card that ranked mode opens on, shared by both games: a title, a short
 * description of ranked play, and a Start button. It overlays the game's own play layout rendered
 * invisibly, so it always fills - and never shrinks below - the footprint that play will occupy.
 * Takes that footprint, optional card sx (its width), and an onStart handler; returns the element.
 */
export function RankedIntroCard({ footprint, cardSx, onStart }: RankedIntroCardProps) {
  const { t } = useTranslation();
  return (
    <Box sx={{ position: 'relative' }}>
      <Box aria-hidden sx={{ visibility: 'hidden' }}>
        {footprint}
      </Box>
      <Box sx={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center' }}>
        <Card stretch sx={[{ minWidth: 0 }, ...(Array.isArray(cardSx) ? cardSx : [cardSx])]}>
          <Stack
            alignItems="center"
            spacing={{ xs: 0.75, sm: 1 }}
            useFlexGap
            sx={{ textAlign: 'center', flex: 1 }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {t('ranked.introTitle')}
            </Typography>
            {/* Grows to fill the reserved height, centering the description between title and Start. */}
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {t('ranked.introBody')}
              </Typography>
            </Box>
            <Box sx={{ width: '100%', pt: 2 }}>
              <Button onClick={onStart} sx={{ width: '100%' }}>
                {t('ranked.start')}
              </Button>
            </Box>
          </Stack>
        </Card>
      </Box>
    </Box>
  );
}
