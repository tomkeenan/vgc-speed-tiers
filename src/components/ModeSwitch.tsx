import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { HeaderIconButton } from './HeaderIconButton';
import { SwordsIcon } from './SwordsIcon';

interface ModeSwitchProps {
  ranked: boolean;
  onChange: (ranked: boolean) => void;
  /** Ranked play needs a signed-in player; the Ranked option is disabled when signed out. */
  signedIn: boolean;
}

/**
 * The header's crossed-swords button that opens a menu to switch the whole app's game mode. The
 * Ranked option is disabled until the player signs in. Takes the current mode, a change handler and
 * the sign-in state, returns the element.
 */
export function ModeSwitch({ ranked, onChange, signedIn }: ModeSwitchProps) {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const choose = (next: boolean) => {
    onChange(next);
    setAnchorEl(null);
  };

  return (
    <>
      <HeaderIconButton
        label={t('mode.label')}
        active={open}
        aria-pressed={undefined}
        aria-haspopup="true"
        aria-expanded={open ? true : undefined}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{ flexShrink: 0 }}
      >
        <SwordsIcon />
      </HeaderIconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem selected={!ranked} onClick={() => choose(false)}>
          {t('mode.practice')}
        </MenuItem>
        <MenuItem
          selected={ranked}
          disabled={!signedIn}
          title={signedIn ? undefined : t('mode.signInRequired')}
          onClick={() => choose(true)}
        >
          {t('mode.ranked')}
        </MenuItem>
      </Menu>
    </>
  );
}
