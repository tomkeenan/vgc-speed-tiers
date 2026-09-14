import { useState } from 'react';
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
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-4 p-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-ink text-2xl font-bold">VGC Speed Tiers</h1>
        <p className="text-ink-muted text-sm">
          Learn Champions-format Speed at level 50 - {meta.count} Pokemon.
        </p>
      </header>

      <TabNav
        tabs={TABS.map(({ key, label }) => ({ key, label }))}
        active={tab}
        onChange={setTab}
      />

      <main className="flex-1">{active.render()}</main>
    </div>
  );
}
