import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import { Button } from './Button';
import type { NameActionError } from '../auth/AuthContext';
import { checkDisplayName, DISPLAY_NAME_MAX } from '../../worker/validateDisplayName';

type ErrorKey =
  | 'auth.nameTaken'
  | 'auth.nameLength'
  | 'auth.nameChars'
  | 'auth.renameTooSoon'
  | 'auth.sessionExpired'
  | 'auth.saveFailed';

// Maps a server-side rejection to its message. The client validates first, so 'invalid_name' is
// only a fallback.
const ACTION_ERROR_KEYS: Record<NameActionError, ErrorKey> = {
  name_taken: 'auth.nameTaken',
  invalid_name: 'auth.nameChars',
  cooldown: 'auth.renameTooSoon',
  reauth: 'auth.sessionExpired',
  failed: 'auth.saveFailed',
};

interface DisplayNameDialogProps {
  open: boolean;
  mode: 'register' | 'rename';
  initialName?: string;
  onSubmit: (name: string) => Promise<void>;
  onClose: () => void;
}

/**
 * Collects a unique display name, either when registering ('register') or changing it ('rename').
 * The name is the only thing ever displayed for a player. Controlled by its parent via `open`.
 */
export function DisplayNameDialog({
  open,
  mode,
  initialName = '',
  onSubmit,
  onClose,
}: DisplayNameDialogProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState(initialName);
  const [errorKey, setErrorKey] = useState<ErrorKey | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Seed the field each time the dialog opens.
  useEffect(() => {
    if (open) {
      setValue(initialName);
      setErrorKey(null);
      setSubmitting(false);
    }
  }, [open, initialName]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const checked = checkDisplayName(value);
    if (!checked.ok) {
      setErrorKey(checked.error === 'length' ? 'auth.nameLength' : 'auth.nameChars');
      return;
    }
    setSubmitting(true);
    setErrorKey(null);
    try {
      await onSubmit(checked.name);
    } catch (err) {
      setErrorKey(ACTION_ERROR_KEYS[err as NameActionError] ?? 'auth.saveFailed');
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {mode === 'rename' ? t('auth.changeDisplayName') : t('auth.chooseDisplayName')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2, fontSize: '0.9rem' }}>
            {t('auth.displayNameSubtitle')}
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            label={t('auth.displayNameLabel')}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            error={errorKey !== null}
            // Reserve the helper-text line so the dialog does not jump; text appears only on error.
            helperText={errorKey !== null ? t(errorKey) : ' '}
            slotProps={{
              htmlInput: { maxLength: DISPLAY_NAME_MAX, 'aria-label': t('auth.displayNameLabel') },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            {t('auth.cancel')}
          </Button>
          <Button type="submit" disabled={submitting || value.trim().length === 0}>
            {t('auth.save')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
