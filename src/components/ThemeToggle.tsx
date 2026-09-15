import { useTranslation } from 'react-i18next';
import IconButton from '@mui/material/IconButton';
import { useColorScheme } from '@mui/material/styles';
import { MoonIcon } from './MoonIcon';
import { SunIcon } from './SunIcon';

/** A header button that toggles the app between the light and dark color schemes. */
export function ThemeToggle() {
  const { t } = useTranslation();
  const { mode, systemMode, setMode } = useColorScheme();

  // Before the theme mounts, mode is undefined; render a spacer so the header layout stays stable.
  if (!mode) {
    return <IconButton disabled aria-hidden sx={{ color: 'text.primary' }} />;
  }

  const resolved = mode === 'system' ? systemMode : mode;
  const isDark = resolved === 'dark';

  return (
    <IconButton
      aria-label={isDark ? t('themeToggle.toLight') : t('themeToggle.toDark')}
      onClick={() => setMode(isDark ? 'light' : 'dark')}
      sx={{ color: 'text.primary' }}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </IconButton>
  );
}
