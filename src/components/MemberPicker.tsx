import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import type { Pokemon } from '../lib/types';

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
 * A searchable multi-select for Pokemon, showing a checkbox, sprite, and name per option
 * and lightweight sprite chips for the selection.
 * Takes a label, the option pool, the selected value, and an onChange, returns the element.
 */
export function MemberPicker({ label, options, value, onChange }: MemberPickerProps) {
  return (
    <Autocomplete<Pokemon, true, false, false>
      multiple
      disableCloseOnSelect
      limitTags={4}
      options={options}
      value={value}
      getOptionLabel={(p) => p.name}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      onChange={(_, next) => onChange(next)}
      renderOption={(props, option, { selected }) => {
        const { key, ...optionProps } = props;
        return (
          <Box component="li" key={key} {...optionProps} sx={{ gap: 1.5 }}>
            <Checkbox edge="start" checked={selected} disableRipple sx={{ p: 0 }} />
            <Box
              component="img"
              src={option.sprite}
              alt=""
              loading="lazy"
              decoding="async"
              sx={spriteSx}
            />
            {option.name}
          </Box>
        );
      }}
      renderTags={(selected, getTagProps) =>
        selected.map((option, index) => {
          const { key, ...tagProps } = getTagProps({ index });
          return (
            <Chip
              key={key}
              {...tagProps}
              label={option.name}
              avatar={
                <Box
                  component="img"
                  src={option.sprite}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  sx={{ objectFit: 'contain' }}
                />
              }
            />
          );
        })
      }
      renderInput={(params) => <TextField {...params} label={label} placeholder="Add Pokemon" />}
    />
  );
}
