import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import { useColorScheme } from '@mui/material/styles';
import { AccountIcon } from './AccountIcon';
import { GearIcon } from './GearIcon';
import { HeaderIconButton } from './HeaderIconButton';
import { EditIcon } from './EditIcon';
import { GoogleIcon } from './GoogleIcon';
import { MoonIcon } from './MoonIcon';
import { SunIcon } from './SunIcon';
import MuiButton from '@mui/material/Button';
import { Button } from './Button';
import { DisplayNameDialog } from './DisplayNameDialog';
import { useAuth } from '../auth/AuthContext';
import { getClientId, loadGoogleIdentity } from '../auth/googleIdentity';

const SIGN_IN_WIDTH = 240;

const ROW_SX = {
  justifyContent: 'flex-start',
  gap: 0.5,
  px: 1,
  py: 0.75,
  borderRadius: 1,
  textTransform: 'none',
  fontWeight: 500,
  color: 'text.primary',
} as const;

interface AccountMenuProps {
  onOpenSettings: () => void;
}

/**
 * The header's account and preferences menu. An account icon (or a gear when sign-in is not
 * configured) opens a popover holding the account section - sign in, or the display name with rename
 * and sign out - above the Settings and Theme controls. Takes onOpenSettings; returns the element.
 */
export function AccountMenu({ onOpenSettings }: AccountMenuProps) {
  const { t, i18n } = useTranslation();
  const {
    user,
    configured,
    needsDisplayName,
    signIn,
    register,
    rename,
    cancelRegistration,
    signOut,
  } = useAuth();
  const { mode, systemMode, setMode } = useColorScheme();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [signInFailed, setSignInFailed] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const open = Boolean(anchorEl);
  const showSignIn = open && configured && !user;

  const renameLockedUntil = user?.canRenameAt != null && user.canRenameAt > Date.now();

  const resolved = mode === 'system' ? systemMode : mode;
  const isDark = resolved === 'dark';

  useEffect(() => {
    if (!showSignIn) return;
    let cancelled = false;
    void loadGoogleIdentity()
      .then((google) => {
        if (cancelled || !overlayRef.current) return;
        overlayRef.current.replaceChildren();
        google.accounts.id.initialize({
          client_id: getClientId(),
          callback: ({ credential }) => {
            setSignInFailed(false);
            void signIn(credential)
              .then(() => setAnchorEl(null))
              .catch((err) => {
                console.error(err);
                setSignInFailed(true);
              });
          },
        });
        google.accounts.id.renderButton(overlayRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text: 'signin_with',
          width: SIGN_IN_WIDTH,
        });
      })
      .catch((err) => console.error(err));
    return () => {
      cancelled = true;
    };
  }, [showSignIn, signIn]);

  return (
    <>
      <HeaderIconButton
        label={configured ? t('auth.account') : t('header.settings')}
        active={open}
        onClick={(event) => {
          setSignInFailed(false);
          setAnchorEl(event.currentTarget);
        }}
      >
        {configured ? <AccountIcon /> : <GearIcon />}
      </HeaderIconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { p: 2, mt: 1 } } }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, width: SIGN_IN_WIDTH }}>
          {configured &&
            (user ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box>
                  <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                    {t('auth.signedIn')}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: 'text.primary',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {user.displayName}
                    </Typography>
                    <IconButton
                      aria-label={t('auth.editName')}
                      size="small"
                      disabled={renameLockedUntil}
                      onClick={() => {
                        setRenaming(true);
                        setAnchorEl(null);
                      }}
                      sx={{ color: 'text.secondary', ml: 'auto' }}
                    >
                      <EditIcon size={16} />
                    </IconButton>
                  </Box>
                  {renameLockedUntil && user.canRenameAt != null && (
                    <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', mt: 0.25 }}>
                      {t('auth.renameAvailableOn', {
                        date: new Date(user.canRenameAt).toLocaleDateString(i18n.language),
                      })}
                    </Typography>
                  )}
                </Box>
                <Button
                  variant="ghost"
                  onClick={() => {
                    signOut();
                    setAnchorEl(null);
                  }}
                >
                  {t('auth.signOut')}
                </Button>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                  {t('auth.signInPrompt')}
                </Typography>
                {/* Our button is the visible layer; Google's real button is overlaid at opacity 0. */}
                <Box sx={{ position: 'relative', height: 40 }}>
                  <Button
                    variant="ghost"
                    startIcon={<GoogleIcon />}
                    sx={{ width: '100%', height: '100%', pointerEvents: 'none' }}
                  >
                    {t('auth.signInWithGoogle')}
                  </Button>
                  <Box
                    ref={overlayRef}
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      opacity: 0,
                      overflow: 'hidden',
                      colorScheme: 'light',
                    }}
                  />
                </Box>
                {signInFailed && (
                  <Typography role="alert" sx={{ fontSize: '0.8rem', color: 'error.main' }}>
                    {t('auth.signInError')}
                  </Typography>
                )}
              </Box>
            ))}

          {configured && <Divider sx={{ mx: -2 }} />}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <MuiButton
              variant="text"
              color="inherit"
              fullWidth
              startIcon={<GearIcon />}
              onClick={() => {
                setAnchorEl(null);
                onOpenSettings();
              }}
              sx={ROW_SX}
            >
              {t('header.settings')}
            </MuiButton>
            <MuiButton
              variant="text"
              color="inherit"
              fullWidth
              disabled={!mode}
              startIcon={isDark ? <SunIcon /> : <MoonIcon />}
              onClick={() => setMode(isDark ? 'light' : 'dark')}
              sx={ROW_SX}
            >
              {isDark ? t('themeToggle.toLight') : t('themeToggle.toDark')}
            </MuiButton>
          </Box>
        </Box>
      </Popover>

      <DisplayNameDialog
        open={needsDisplayName}
        mode="register"
        onSubmit={register}
        onClose={cancelRegistration}
      />
      <DisplayNameDialog
        open={renaming}
        mode="rename"
        initialName={user?.displayName ?? ''}
        onSubmit={async (name) => {
          await rename(name);
          setRenaming(false);
        }}
        onClose={() => setRenaming(false)}
      />
    </>
  );
}
