import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import { FasterGame } from './features/faster-game/FasterGame';
import { HowFast } from './features/how-fast/HowFast';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { TabNav } from './components/TabNav';
import { DecksProvider } from './decks/DecksContext';
import { useAuth } from './auth/AuthContext';
import type { BoardKey } from '../worker/boards';

// Loaded on demand so its heavy MUI surface (Autocomplete, Dialog) stays out of the initial chunk.
const SettingsDialog = lazy(() =>
  import('./features/settings/SettingsDialog').then((m) => ({ default: m.SettingsDialog })),
);

// Loaded on demand: the leaderboard's data-fetching screen carries its own MUI surface.
const LeaderboardScreen = lazy(() =>
  import('./ranked/LeaderboardScreen').then((m) => ({ default: m.LeaderboardScreen })),
);

interface TabContext {
  ranked: boolean;
  leaderboardBoard: BoardKey | undefined;
  onViewLeaderboard: (board: BoardKey) => void;
}

const TABS = [
  {
    key: 'leaderboard',
    labelKey: 'tabs.leaderboard',
    render: (ctx: TabContext) => <LeaderboardScreen initialBoard={ctx.leaderboardBoard} />,
  },
  {
    key: 'faster',
    labelKey: 'tabs.faster',
    render: (ctx: TabContext) => (
      <FasterGame ranked={ctx.ranked} onViewLeaderboard={ctx.onViewLeaderboard} />
    ),
  },
  {
    key: 'howfast',
    labelKey: 'tabs.howFast',
    render: (ctx: TabContext) => (
      <HowFast ranked={ctx.ranked} onViewLeaderboard={ctx.onViewLeaderboard} />
    ),
  },
] as const;

type TabKey = (typeof TABS)[number]['key'];

/** Root component: header, tab navigation, the active feature, and the settings dialog. */
export default function App() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const signedIn = Boolean(user);
  const [tab, setTab] = useState<TabKey>('faster');
  const [ranked, setRanked] = useState(signedIn);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [leaderboardBoard, setLeaderboardBoard] = useState<BoardKey | undefined>(undefined);
  const active = TABS.find((t) => t.key === tab) ?? TABS[0];

  const viewLeaderboard = (board: BoardKey) => {
    setLeaderboardBoard(board);
    setTab('leaderboard');
  };

  const prevSignedIn = useRef(signedIn);
  useEffect(() => {
    if (prevSignedIn.current !== signedIn) {
      setRanked(signedIn);
      prevSignedIn.current = signedIn;
    }
  }, [signedIn]);

  return (
    <DecksProvider>
      <Box
        sx={{
          mx: 'auto',
          maxWidth: '42rem',
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          p: 2,
        }}
      >
        <Header
          onOpenSettings={() => setSettingsOpen(true)}
          ranked={ranked}
          onRankedChange={setRanked}
        />

        <TabNav
          tabs={TABS.map(({ key, labelKey }) => ({ key, label: t(labelKey) }))}
          active={tab}
          onChange={setTab}
        />

        <Box component="main" sx={{ flex: 1 }}>
          <Suspense fallback={null}>
            {active.render({ ranked, leaderboardBoard, onViewLeaderboard: viewLeaderboard })}
          </Suspense>
        </Box>

        <Footer />
      </Box>

      {settingsOpen && (
        <Suspense fallback={null}>
          <SettingsDialog open onClose={() => setSettingsOpen(false)} />
        </Suspense>
      )}
    </DecksProvider>
  );
}
