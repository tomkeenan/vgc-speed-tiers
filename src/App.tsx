import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import Box from '@mui/material/Box';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { TabNav } from './components/TabNav';
import { DecksProvider } from './decks/DecksContext';
import { useAuth } from './auth/AuthContext';
import type { BoardKey } from '../worker/boards';

const FasterGame = lazy(() =>
  import('./features/faster-game/FasterGame').then((m) => ({ default: m.FasterGame })),
);
const HowFast = lazy(() =>
  import('./features/how-fast/HowFast').then((m) => ({ default: m.HowFast })),
);

// Loaded on demand so its heavy MUI surface (Autocomplete, Dialog) stays out of the initial chunk.
const SettingsDialog = lazy(() =>
  import('./features/settings/SettingsDialog').then((m) => ({ default: m.SettingsDialog })),
);

// Loaded on demand: the leaderboard's data-fetching screen carries its own MUI surface.
const LeaderboardScreen = lazy(() =>
  import('./ranked/LeaderboardScreen').then((m) => ({ default: m.LeaderboardScreen })),
);

const TABS = [
  { key: 'leaderboard', path: '/leaderboard', labelKey: 'tabs.leaderboard' },
  { key: 'faster', path: '/faster', labelKey: 'tabs.faster' },
  { key: 'howfast', path: '/howfast', labelKey: 'tabs.howFast' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

/** Root component: header, tab navigation, the active feature route, and the settings dialog. */
export default function App() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const signedIn = Boolean(user);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [ranked, setRanked] = useState(signedIn);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const activeTab: TabKey =
    TABS.find((tab) => location.pathname.startsWith(tab.path))?.key ?? 'faster';
  const leaderboardBoard = (searchParams.get('board') as BoardKey | null) ?? undefined;

  const goToTab = (key: TabKey) => {
    const target = TABS.find((tab) => tab.key === key);
    if (target) navigate(target.path);
  };

  const viewLeaderboard = (board: BoardKey) => {
    navigate(`/leaderboard?board=${encodeURIComponent(board)}`);
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
          minHeight: '100svh',
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
          active={activeTab}
          onChange={goToTab}
        />

        <Box component="main" sx={{ flex: 1 }}>
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<Navigate to="/faster" replace />} />
              <Route
                path="/faster"
                element={<FasterGame ranked={ranked} onViewLeaderboard={viewLeaderboard} />}
              />
              <Route
                path="/howfast"
                element={<HowFast ranked={ranked} onViewLeaderboard={viewLeaderboard} />}
              />
              <Route
                path="/leaderboard"
                element={<LeaderboardScreen initialBoard={leaderboardBoard} />}
              />
              <Route path="*" element={<Navigate to="/faster" replace />} />
            </Routes>
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
