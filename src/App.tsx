import { lazy, Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import { Flashcards } from './features/flashcards/Flashcards';
import { FasterGame } from './features/faster-game/FasterGame';
import { HowFast } from './features/how-fast/HowFast';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { TabNav } from './components/TabNav';
import { DecksProvider } from './decks/DecksContext';
import type { BoardKey } from '../worker/boards';

// Loaded on demand so its heavy MUI surface (Autocomplete, Dialog) stays out of the initial chunk.
const SettingsDialog = lazy(() =>
  import('./features/settings/SettingsDialog').then((m) => ({ default: m.SettingsDialog })),
);

// Loaded on demand: the leaderboard's data-fetching screen is only needed once opened.
const LeaderboardScreen = lazy(() =>
  import('./ranked/LeaderboardScreen').then((m) => ({ default: m.LeaderboardScreen })),
);

const TABS = [
  { key: 'flashcards', labelKey: 'tabs.flashcards', render: () => <Flashcards /> },
  { key: 'faster', labelKey: 'tabs.faster', render: () => <FasterGame /> },
  { key: 'howfast', labelKey: 'tabs.howFast', render: () => <HowFast /> },
] as const;

type TabKey = (typeof TABS)[number]['key'];

/** Root component: header, tab navigation, the two features, and the settings dialog. */
export default function App() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<TabKey>('faster');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const active = TABS.find((t) => t.key === tab) ?? TABS[0];

  // Open the leaderboard on the board that matches the current game; the screen can switch boards.
  const leaderboardBoard: BoardKey = tab === 'howfast' ? 'howfast:standard' : 'faster:standard';

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
          onToggleLeaderboard={() => setShowLeaderboard((v) => !v)}
          leaderboardActive={showLeaderboard}
        />

        <TabNav
          tabs={TABS.map(({ key, labelKey }) => ({ key, label: t(labelKey) }))}
          active={tab}
          onChange={setTab}
        />

        <Box component="main" sx={{ flex: 1 }}>{active.render()}</Box>

        <Footer />
      </Box>

      {/* The leaderboard is a modal over the game, opening on the board matching the current tab. */}
      {showLeaderboard && (
        <Suspense fallback={null}>
          <LeaderboardScreen
            initialBoard={leaderboardBoard}
            onClose={() => setShowLeaderboard(false)}
          />
        </Suspense>
      )}

      {settingsOpen && (
        <Suspense fallback={null}>
          <SettingsDialog open onClose={() => setSettingsOpen(false)} />
        </Suspense>
      )}
    </DecksProvider>
  );
}
