import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { TrophyIcon } from '../components/TrophyIcon';
import { useAuth } from '../auth/AuthContext';
import { fasterBoard, HOWFAST_BOARD, type BoardKey } from '../../worker/boards';
import { cachedLeaderboards, fetchAllLeaderboards, type LeaderboardResult } from './api';
import { MEDAL_TRIM } from './medals';

type Game = 'faster' | 'howfast';

/** Splits the board a leaderboard opens on into the tab and modifier toggles it corresponds to. */
function decompose(board: BoardKey): { game: Game; hard: boolean; natures: boolean } {
  if (board === 'howfast:standard') return { game: 'howfast', hard: false, natures: false };
  return {
    game: 'faster',
    hard: board === 'faster:hard' || board === 'faster:hard+natures',
    natures: board === 'faster:natures' || board === 'faster:hard+natures',
  };
}

interface LeaderboardScreenProps {
  /** The board to open on; the game tab and modifier chips can switch it afterwards. */
  initialBoard?: BoardKey;
}

const ROW_COLUMNS = '2.5rem 1fr auto';

// The game selector mirrors the header's Practice/Ranked segmented control: a full-width, exclusive
// ToggleButtonGroup whose buttons share the row evenly.
const GAME_TOGGLE_SX = { flex: 1, textTransform: 'none', fontWeight: 600, lineHeight: 1.2 } as const;

/** The leaderboard shows the top ten; a player outside it still sees their own standing at the foot. */
const TOP_N = 10;

// Reserve roughly a full TOP_N list's height for the body so switching boards - or waiting on a first
// load - never resizes the modal (the resize was flashing the game screen behind the dialog). A tall
// board just grows past this; a short one keeps this floor. ~36px per row plus the column header.
const BODY_MIN_HEIGHT = TOP_N * 36 + 20;

/**
 * A single ranked row: rank, player, streak. The top-3 get medal trim; the signed-in player's rows
 * are highlighted. A null rank (a player with no result yet) shows a dash. The "You" chip only
 * renders when `showChip` is set - it marks the pinned footer row, not the player's list row.
 */
function Row({
  rank,
  name,
  streak,
  isYou,
  youLabel,
  showChip = false,
}: {
  rank: number | null;
  name: string;
  streak: number;
  isYou: boolean;
  youLabel: string;
  showChip?: boolean;
}) {
  const medal = rank != null ? MEDAL_TRIM[rank] : undefined;
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
        {rank ?? '-'}
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
        {showChip && (
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
 * The ranked leaderboard: a segment per game (Who's Faster? / How Fast?) over a scrollable top-N list.
 * Who's Faster? carries a Mode dropdown that switches between its four boards (Standard, Hard, Natures,
 * Hard + Natures). Opens on the board matching the current game, highlights the signed-in player's rows,
 * and surfaces their own standing at the foot even when they are not in the visible top-N.
 */
export function LeaderboardScreen({ initialBoard = 'faster:standard' }: LeaderboardScreenProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const initial = decompose(initialBoard);
  const [game, setGame] = useState<Game>(initial.game);
  const [hard, setHard] = useState(initial.hard);
  const [natures, setNatures] = useState(initial.natures);

  // The board is derived from the tab and the two independent modifier chips.
  const board: BoardKey = game === 'howfast' ? HOWFAST_BOARD : fasterBoard(hard, natures);

  // Every board is fetched in a single request when the modal opens, so switching tabs and chips
  // reads straight from `boards` state with no per-board request and no flicker. A stale-while-
  // revalidate cache paints a reopen instantly while the background refetch keeps it current.
  const [boards, setBoards] = useState<LeaderboardResult[] | null>(
    () => cachedLeaderboards(TOP_N) ?? null,
  );
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    fetchAllLeaderboards(TOP_N)
      .then((result) => {
        if (active) {
          setBoards(result);
          setFailed(false);
        }
      })
      .catch(() => {
        if (active && cachedLeaderboards(TOP_N) == null) {
          setBoards(null);
          setFailed(true);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  // The shown board's slice, derived from the single all-boards read - switching is instant.
  const data = boards?.find((b) => b.board === board) ?? null;

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

  // Footer: the signed-in player's own standing, always pinned below the list so they can see where
  // they stand even when they're inside the top-N or have no result on this board yet. Signed out,
  // it invites them to sign in instead.
  const me = data?.me ?? null;

  const meFooter = () => (
    <Box sx={{ pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
      {user ? (
        <Row
          rank={me?.rank ?? null}
          name={myName ?? t('ranked.you')}
          streak={me?.streak ?? 0}
          isYou
          showChip
          youLabel={t('ranked.you')}
        />
      ) : (
        <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 0.75 }}>
          {t('ranked.signInToRank')}
        </Typography>
      )}
    </Box>
  );

  const onModeChange = (value: BoardKey) => {
    const d = decompose(value);
    setHard(d.hard);
    setNatures(d.natures);
  };

  return (
    <Stack spacing={2}>
      <ToggleButtonGroup
        exclusive
        size="small"
        color="primary"
        value={game}
        onChange={(_, next: Game | null) => {
          if (next) setGame(next);
        }}
        aria-label={t('ranked.leaderboardTitle')}
        sx={{ display: 'flex', width: '100%' }}
      >
        <ToggleButton value="faster" sx={GAME_TOGGLE_SX}>
          {t('ranked.games.faster')}
        </ToggleButton>
        <ToggleButton value="howfast" sx={GAME_TOGGLE_SX}>
          {t('ranked.games.howFast')}
        </ToggleButton>
      </ToggleButtonGroup>

      {/* The Mode dropdown chooses among Who's Faster?'s four boards. How Fast? has only one board, so
          it hides the control while keeping its space reserved (visibility, not display) - both tabs
          take the same height and the list below never shifts when switching games. */}
      <Box sx={{ visibility: game === 'faster' ? 'visible' : 'hidden' }} aria-hidden={game !== 'faster'}>
        <FormControl size="small" fullWidth disabled={game !== 'faster'}>
          <InputLabel id="leaderboard-mode-label">{t('ranked.modes.label')}</InputLabel>
          <Select
            labelId="leaderboard-mode-label"
            label={t('ranked.modes.label')}
            value={fasterBoard(hard, natures)}
            onChange={(e) => onModeChange(e.target.value as BoardKey)}
          >
            <MenuItem value="faster:standard">{t('ranked.modes.standard')}</MenuItem>
            <MenuItem value="faster:hard">{t('ranked.chips.hard')}</MenuItem>
            <MenuItem value="faster:natures">{t('ranked.chips.natures')}</MenuItem>
            <MenuItem value="faster:hard+natures">
              {`${t('ranked.chips.hard')} + ${t('ranked.chips.natures')}`}
            </MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ minHeight: BODY_MIN_HEIGHT }}>{body()}</Box>

      {data && meFooter()}
    </Stack>
  );
}
