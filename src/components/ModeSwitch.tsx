import { useTranslation } from 'react-i18next';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

interface ModeSwitchProps {
  ranked: boolean;
  onChange: (ranked: boolean) => void;
  /** Ranked play needs a signed-in player; the Ranked option is disabled when signed out. */
  signedIn: boolean;
}

const BUTTON_SX = {
  px: 1.5,
  py: 0.5,
  textTransform: 'none',
  fontWeight: 600,
  lineHeight: 1.2,
} as const;

/**
 * The header's Practice/Ranked segmented control that switches the whole app's game mode. The Ranked
 * option is disabled until the player signs in. Takes the current mode, a change handler and the
 * sign-in state, returns the element.
 */
export function ModeSwitch({ ranked, onChange, signedIn }: ModeSwitchProps) {
  const { t } = useTranslation();
  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      color="primary"
      value={ranked ? 'ranked' : 'practice'}
      onChange={(_, value) => {
        if (value === 'practice') onChange(false);
        else if (value === 'ranked') onChange(true);
      }}
      aria-label={t('mode.label')}
      sx={{ flexShrink: 0 }}
    >
      <ToggleButton value="practice" sx={BUTTON_SX}>
        {t('mode.practice')}
      </ToggleButton>
      <ToggleButton
        value="ranked"
        disabled={!signedIn}
        title={signedIn ? undefined : t('mode.signInRequired')}
        sx={BUTTON_SX}
      >
        {t('mode.ranked')}
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
