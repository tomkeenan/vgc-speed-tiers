import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import type { GameMode } from './mode';

interface ModeTogglesProps {
  mode: GameMode;
  onChange: (mode: GameMode) => void;
}

interface ModeRowProps {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/** One settings-style row: a title, an always-visible description, and a Switch on the right. */
function ModeRow({ title, description, checked, onChange }: ModeRowProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 600 }}>{title}</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {description}
        </Typography>
      </Box>
      <Switch
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        inputProps={{ 'aria-label': title }}
        sx={{ flexShrink: 0 }}
      />
    </Box>
  );
}

/**
 * The Who's Faster? game-mode switches, each with an inline description of what it does.
 * Takes the current mode and a change handler, returns the element.
 */
export function ModeToggles({ mode, onChange }: ModeTogglesProps) {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        px: 2,
        py: 1,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <ModeRow
        title={t('faster.hardMode.title')}
        description={t('faster.hardMode.description')}
        checked={mode.hardMode}
        onChange={(hardMode) => onChange({ ...mode, hardMode })}
      />
      <Divider sx={{ my: 1 }} />
      <ModeRow
        title={t('faster.allowNatures.title')}
        description={t('faster.allowNatures.description')}
        checked={mode.allowNatures}
        onChange={(allowNatures) => onChange({ ...mode, allowNatures })}
      />
    </Box>
  );
}
