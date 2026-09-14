import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Flashcards } from './features/flashcards/Flashcards';
import { FasterGame } from './features/faster-game/FasterGame';
import { SpeedExplorer } from './features/speed-explorer/SpeedExplorer';
import { TabNav } from './components/TabNav';
import { getMeta } from './lib/data';

const TABS = [
  { key: 'flashcards', label: 'Flashcards', render: () => <Flashcards /> },
  { key: 'faster', label: "Who's Faster?", render: () => <FasterGame /> },
  { key: 'explorer', label: 'Explorer', render: () => <SpeedExplorer /> },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function App() {
  const [tab, setTab] = useState<TabKey>('flashcards');
  const meta = getMeta();
  const active = TABS.find((t) => t.key === tab) ?? TABS[0];

  return (
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
      <Box component="header" sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Typography
          component="h1"
          sx={{ fontSize: '1.5rem', fontWeight: 700, color: 'text.primary' }}
        >
          VGC Speed Tiers
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
          Learn Champions-format Speed at level 50 - {meta.count} Pokemon.
        </Typography>
      </Box>

      <TabNav
        tabs={TABS.map(({ key, label }) => ({ key, label }))}
        active={tab}
        onChange={setTab}
      />

      <Box component="main" sx={{ flex: 1 }}>
        {active.render()}
      </Box>
    </Box>
  );
}
