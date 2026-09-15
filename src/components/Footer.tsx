import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { MailIcon } from './MailIcon';

const EMAIL = 'tomjameskeenan@gmail.com';

/**
 * A minimal site footer: an icon row plus a credit line.
 * The email icon copies the address to the clipboard and briefly confirms.
 */
export function Footer() {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Clear the pending "Copied!" reset if the component unmounts mid-flight.
  useEffect(() => () => clearTimeout(timer.current), []);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(EMAIL);
    } catch {
      return; // Clipboard blocked (e.g. insecure context); leave the tooltip unchanged.
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Box
      component="footer"
      sx={{
        mt: 2,
        pt: 2,
        borderTop: 1,
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.5,
        color: 'text.secondary',
      }}
    >
      <Typography sx={{ fontSize: '0.75rem' }}>{t('footer.madeBy')}</Typography>

      <Tooltip title={copied ? t('common.copied') : EMAIL}>
        <IconButton
          aria-label={t('footer.copyEmail')}
          onClick={copyEmail}
          size="small"
          sx={{ color: 'inherit' }}
        >
          <MailIcon size={16} />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
