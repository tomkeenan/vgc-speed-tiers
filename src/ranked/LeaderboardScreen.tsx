import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import { useMediaQuery, useTheme } from '@mui/material';
import { CloseIcon } from '../components/CloseIcon';
import { TrophyIcon } from '../components/TrophyIcon';
import { useAuth } from '../auth/AuthContext';
import { fasterBoard, HOWFAST_BOARD, type BoardKey } from '../../worker/boards';
import { cachedLeaderboard, fetchLeaderboard, type LeaderboardResult } from './api';

type Game = 'faster' | 'howfast';

/** Splits the board a leaderboard opens on into the tab and modifier toggles it corresponds to. */
function decompose(board: BoardKey): { game: Game; hard: boolean; natures: boolean } {
  if (board === 'howfast:standard') return { game: 'howfast', hard: false, natures: false };
  return {
    game: 'faster',
    hard: board === 'faster:hard' || board === 'faster:hard+natures',
    natures: board === 'faster:hard+natures',
  };
}

interface LeaderboardScreenProps {
  /** The board to open on; the game tab and modifier chips can switch it afterwards. */
  initialBoard: BoardKey;
  onClose: () => void;
}

const ROW_COLUMNS = '2.5rem 1fr auto';

/** The leaderboard shows the top ten; a player outside it still sees their own standing at the foot. */
const TOP_N = 10;

// Reserve roughly a full TOP_N list's height for the body so switching boards - or waiting on a first
// load - never resizes the modal (the resize was flashing the game screen behind the dialog). A tall
// board just grows past this; a short one keeps this floor. ~36px per row plus the column header.
const BODY_MIN_HEIGHT = TOP_N * 36 + 20;

// Medal colours for the podium places. Fixed metallic hues that read on both the light and dark
// themes; the podium rank number and a trophy icon beside the name are tinted in their medal colour.
const MEDAL_TRIM: Record<number, string> = {
  1: '#E4B21E', // gold
  2: '#9AA0A6', // silver
  3: '#C77B3B', // bronze
};

/** A single ranked row: rank, player, streak. The top-3 get medal trim; the signed-in player's rows are highlighted. */
function Row({
  rank,
  name,
  streak,
  isYou,
  youLabel,
}: {
  rank: number;
  name: string;
  streak: number;
  isYou: boolean;
  youLabel: string;
}) {
  const medal = MEDAL_TRIM[rank];
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: ROW_COLUMNS,
        alignItems: 'center',
        gap: 1,
        pr: 1,
        pl: 1,
        py: 0.75,
        borderRadius: 1,
        bgcolor: isYou ? 'action.selected' : 'transparent',
      }}
    >
      <Typography
        sx={{
          color: medal ?? 'text.secondary',
          fontWeight: medal ? 700 : 400,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {rank}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
        <Typography sx={{ fontWeight: isYou ? 700 : 500 }} noWrap>
          {name}
        </Typography>
        {medal && (
          <Box component="span" sx={{ flexShrink: 0, display: 'flex', color: medal }}>
            <TrophyIcon size={16} />
          </Box>
        )}
        {isYou && (
          <Typography
            component="span"
            sx={{
              flexShrink: 0,
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'primary.main',
              border: '1px solid',
              borderColor: 'primary.main',
              borderRadius: 1,
              px: 0.5,
            }}
          >
            {youLabel}
          </Typography>
        )}
      </Box>
      <Typography sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{streak}</Typography>
    </Box>
  );
}

/**
 * The ranked leaderboard modal: a tab per game (Who's Faster? / How Fast?) over a scrollable top-N
 * list. Who's Faster? carries independent Hard and Natures toggle chips that switch between its four
 * boards. Opens on the board matching the current game, highlights the signed-in player's rows, and
 * surfaces their own standing at the foot even when they are not in the visible top-N.
 */
export function LeaderboardScreen({ initialBoard, onClose }: LeaderboardScreenProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  const initial = decompose(initialBoard);
  const [game, setGame] = useState<Game>(initial.game);
  const [hard, setHard] = useState(initial.hard);
  const [natures, setNatures] = useState(initial.natures);

  // The board is derived from the tab and the two independent modifier chips.
  const board: BoardKey = game === 'howfast' ? HOWFAST_BOARD : fasterBoard(hard, natures);

  // Reads come from a stale-while-revalidate cache: a board we have loaded before shows instantly
  // (no spinner, no resize), and every open still refetches in the background to stay current.
  const [data, setData] = useState<LeaderboardResult | null>(() => cachedLeaderboard(board, TOP_N) ?? null);
  const [failed, setFailed] = useState(false);

  // On a tab/chip switch, swap to the new board's cached data during render (React re-renders before
  // painting, so the previous board's rows are never shown for a frame). This is what keeps the modal
  // from collapsing to a spinner and flashing the game screen behind it. Uncached boards fall back to
  // the reserved-height spinner until the fetch lands.
  const [shownBoard, setShownBoard] = useState(board);
  if (board !== shownBoard) {
    setShownBoard(board);
    setData(cachedLeaderboard(board, TOP_N) ?? null);
    setFailed(false);
  }

  // Background revalidation for whichever board is showing. The `active` guard drops a stale response
  // if the board changes again mid-flight; a failed refresh only surfaces when nothing is cached.
  useEffect(() => {
    let active = true;
    fetchLeaderboard(board, TOP_N)
      .then((result) => {
        if (active) {
          setData(result);
          setFailed(false);
        }
      })
      .catch(() => {
        if (active && cachedLeaderboard(board, TOP_N) == null) {
          setData(null);
          setFailed(true);
        }
      });
    return () => {
      active = false;
    };
  }, [board]);

  const myName = user?.displayName ?? null;
  const entries = data?.entries ?? [];

  const body = () => {
    if (failed) {
      return (
        <Typography role="alert" sx={{ color: 'error.main', textAlign: 'center', py: 3 }}>
          {t('ranked.loadError')}
        </Typography>
      );
    }
    // The spinner only appears for an uncached board (first ever load of it); cached boards render
    // their rows straight away. The reserved min-height on the body wrapper keeps this from resizing.
    if (!data) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <CircularProgress aria-label={t('ranked.loading')} />
        </Box>
      );
    }
    if (entries.length === 0) {
      return (
        <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 3 }}>
          {t('ranked.empty')}
        </Typography>
      );
    }
    return (
      <Box>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: ROW_COLUMNS,
            gap: 1,
            px: 1,
            pb: 0.5,
            color: 'text.secondary',
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          <Box component="span">{t('ranked.colRank')}</Box>
          <Box component="span">{t('ranked.colPlayer')}</Box>
          <Box component="span" sx={{ textAlign: 'right' }}>
            {t('ranked.colStreak')}
          </Box>
        </Box>
        {entries.map((e) => (
          <Row
            key={e.rank}
            rank={e.rank}
            name={e.displayName}
            streak={e.streak}
            isYou={myName != null && e.displayName === myName}
            youLabel={t('ranked.you')}
          />
        ))}
      </Box>
    );
  };

  // Footer: the signed-in player's own standing when it is not already visible in the top-N.
  const me = data?.me ?? null;
  const meInList = me != null && entries.some((e) => e.rank === me.rank && e.streak === me.streak);
  const showMe = me != null && !meInList;

  return (
    <Dialog
      open
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      fullScreen={fullScreen}
      // The modal sizes to its content (the rows plus the "you" footer), so short boards leave no
      // dead space. MUI still caps the height to the viewport, scrolling the list if a board is tall.
    >
      <DialogTitle
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}
      >
        <Box component="span" sx={{ fontWeight: 700 }}>
          {t('ranked.leaderboardTitle')}
        </Box>
        <IconButton
          aria-label={t('ranked.closeLeaderboard')}
          onClick={onClose}
          sx={{ color: 'text.primary' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2}>
          {/* One tab per game. The modifier chips sit below the list so switching tabs never
              shifts it, and their row height is reserved on every tab so the modal keeps a
              constant size (only the Who's Faster? tab actually fills the row). */}
          <Tabs
            value={game}
            onChange={(_, next: Game) => setGame(next)}
            variant="fullWidth"
            aria-label={t('ranked.leaderboardTitle')}
          >
            <Tab value="faster" label={t('ranked.games.faster')} />
            <Tab value="howfast" label={t('ranked.games.howFast')} />
          </Tabs>

          <Box sx={{ minHeight: BODY_MIN_HEIGHT }}>{body()}</Box>

          {/* Modifier chips: each toggles its own Who's Faster? board. Off by default (outlined),
              primary and filled when on. Hard and Natures are independent. The row's height is
              reserved (MUI Chip default, 32px) even on the How Fast? tab so the modal never
              resizes when tabs change. */}
          <Box
            sx={{ display: 'flex', justifyContent: 'center', gap: 1, minHeight: 32 }}
          >
            {game === 'faster' && (
              <>
                <Chip
                  label={t('ranked.chips.hard')}
                  clickable
                  color={hard ? 'primary' : 'default'}
                  variant={hard ? 'filled' : 'outlined'}
                  onClick={() => setHard((on) => !on)}
                  aria-pressed={hard}
                />
                <Chip
                  label={t('ranked.chips.natures')}
                  clickable
                  color={natures ? 'primary' : 'default'}
                  variant={natures ? 'filled' : 'outlined'}
                  onClick={() => setNatures((on) => !on)}
                  aria-pressed={natures}
                />
              </>
            )}
          </Box>

          {showMe && me && (
            <Box sx={{ pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
              <Row
                rank={me.rank}
                name={myName ?? t('ranked.you')}
                streak={me.streak}
                isYou
                youLabel={t('ranked.you')}
              />
            </Box>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
