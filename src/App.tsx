import { lazy, Suspense, useState } from 'react';
import Box from '@mui/material/Box';
import { Flashcards } from './features/flashcards/Flashcards';
import { FasterGame } from './features/faster-game/FasterGame';
import { HowFast } from './features/how-fast/HowFast';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { TabNav } from './components/TabNav';
import { DecksProvider } from './decks/DecksContext';

// Loaded on demand so its heavy MUI surface (Autocomplete, Dialog) stays out of the initial chunk.
const SettingsDialog = lazy(() =>
  import('./features/settings/SettingsDialog').then((m) => ({ default: m.SettingsDialog })),
);

const TABS = [
  { key: 'flashcards', label: 'Flashcards', render: () => <Flashcards /> },
  { key: 'faster', label: "Who's Faster?", render: () => <FasterGame /> },
  { key: 'howfast', label: 'How Fast?', render: () => <HowFast /> },
] as const;

type TabKey = (typeof TABS)[number]['key'];

/** Root component: header, tab navigation, the two features, and the settings dialog. */
export default function App() {
  const [tab, setTab] = useState<TabKey>('flashcards');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const active = TABS.find((t) => t.key === tab) ?? TABS[0];

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
        <Header onOpenSettings={() => setSettingsOpen(true)} />

        <TabNav
          tabs={TABS.map(({ key, label }) => ({ key, label }))}
          active={tab}
          onChange={setTab}
        />

        <Box component="main" sx={{ flex: 1 }}>
          {active.render()}
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
