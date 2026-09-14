import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/**
 * A labelled on/off switch.
 * Takes a label, the checked state, and an onChange handler, returns the element.
 */
export function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <FormControlLabel
      label={label}
      labelPlacement="start"
      control={<Switch checked={checked} onChange={(e) => onChange(e.target.checked)} />}
      sx={{
        m: 0,
        width: '100%',
        justifyContent: 'space-between',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '12px',
        bgcolor: 'background.paper',
        px: 2,
        py: 1,
        '& .MuiFormControlLabel-label': { fontSize: '0.875rem', fontWeight: 600 },
      }}
    />
  );
}
