import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

interface TabItem<T extends string> {
  key: T;
  label: string;
}

interface TabNavProps<T extends string> {
  tabs: TabItem<T>[];
  active: T;
  onChange: (key: T) => void;
}

/**
 * A horizontal tab bar for switching between features.
 * Takes the tab list, the active key, and an onChange handler, returns the element.
 */
export function TabNav<T extends string>({ tabs, active, onChange }: TabNavProps<T>) {
  return (
    <Tabs
      value={active}
      onChange={(_, value) => onChange(value as T)}
      variant="fullWidth"
      aria-label="Features"
    >
      {tabs.map((tab) => (
        <Tab key={tab.key} value={tab.key} label={tab.label} />
      ))}
    </Tabs>
  );
}
