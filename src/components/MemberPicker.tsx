import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import MuiButton from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { Pokemon } from '../lib/types';
import { displayName } from '../lib/data';

interface MemberPickerProps {
  label: string;
  options: Pokemon[];
  value: Pokemon[];
  onChange: (next: Pokemon[]) => void;
}

const spriteSx = {
  width: 32,
  height: 32,
  flexShrink: 0,
  objectFit: 'contain',
  bgcolor: 'background.default',
  borderRadius: '8px',
} as const;

/**
 * A searchable multi-select for Pokemon: a pinned search field, the current selection shown as
 * removable chips, then an always-visible scrollable checklist of options (checkbox + sprite +
 * name), so on mobile the on-screen keyboard never hides the list the way a dropdown would.
 * Takes a label, the option pool, the selected value, and an onChange, returns the element.
 */
export function MemberPicker({ label, options, value, onChange }: MemberPickerProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [query, setQuery] = useState('');
  const selectedIds = useMemo(() => new Set(value.map((p) => p.id)), [value]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    // Match either the localized name or the base English name, so both spellings find the Pokemon.
    return options.filter(
      (p) => displayName(p, lang).toLowerCase().includes(q) || p.name.toLowerCase().includes(q),
    );
  }, [options, query, lang]);

  const remove = (id: string) => onChange(value.filter((v) => v.id !== id));
  const toggle = (p: Pokemon) => {
    if (selectedIds.has(p.id)) remove(p.id);
    else onChange([...value, p]);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <TextField
        label={label}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('memberPicker.searchPlaceholder')}
        size="small"
        fullWidth
      />
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 0.5 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {t('memberPicker.selectedCount', { n: value.length })}
        </Typography>
        {value.length > 0 && (
          <MuiButton size="small" variant="text" onClick={() => onChange([])}>
            {t('memberPicker.clear')}
          </MuiButton>
        )}
      </Box>
      {value.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
          {value.map((p) => (
            <Chip
              key={p.id}
              avatar={<Avatar src={p.sprite} alt="" imgProps={{ loading: 'lazy' }} />}
              label={displayName(p, lang)}
              onDelete={() => remove(p.id)}
              size="small"
              variant="outlined"
            />
          ))}
        </Box>
      )}
      <Box
        role="listbox"
        aria-label={t('memberPicker.optionsAria', { label })}
        aria-multiselectable="true"
        sx={{
          maxHeight: 280,
          overflowY: 'auto',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '8px',
        }}
      >
        {filtered.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'text.secondary', p: 2, textAlign: 'center' }}>
            {t('memberPicker.noMatches')}
          </Typography>
        ) : (
          filtered.map((p) => (
            <Box
              component="label"
              key={p.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 1.5,
                py: 0.75,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <Checkbox
                edge="start"
                checked={selectedIds.has(p.id)}
                onChange={() => toggle(p)}
                disableRipple
                sx={{ p: 0 }}
              />
              <Box
                component="img"
                src={p.sprite}
                alt=""
                loading="lazy"
                decoding="async"
                sx={spriteSx}
              />
              <Typography component="span" variant="body2">
                {displayName(p, lang)}
              </Typography>
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
}
