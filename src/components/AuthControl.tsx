import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import { AccountIcon } from './AccountIcon';
import { HeaderIconButton } from './HeaderIconButton';
import { EditIcon } from './EditIcon';
import { GoogleIcon } from './GoogleIcon';
import { Button } from './Button';
import { DisplayNameDialog } from './DisplayNameDialog';
import { useAuth } from '../auth/AuthContext';
import { getClientId, loadGoogleIdentity } from '../auth/googleIdentity';

// Width (px) shared by our visible button and the invisible Google button layered on top, so the
// two stay aligned and a click anywhere on the visible button lands on Google's real button.
const SIGN_IN_WIDTH = 240;

/**
 * Header account control. A small account icon (right of the settings cog) opens a popover.
 * Signed out, the popover offers a "Sign in with Google" button; signed in, it shows the display
 * name with a rename control and a sign-out control. The Google Identity script and its button are
 * only loaded when the popover is opened, so no Google UI touches the page until the player goes to
 * sign in. Renders nothing when sign-in is not configured.
 */
export function AuthControl() {
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
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [signInFailed, setSignInFailed] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const open = Boolean(anchorEl);
  const showSignIn = open && !user;

  const renameLockedUntil = user?.canRenameAt != null && user.canRenameAt > Date.now();

  // Render Google's real button (invisible, overlaid on ours) only while the sign-in popover is
  // open. We use the rendered button rather than One Tap because browsers can silently suppress
  // One Tap; the button always opens Google's full account chooser.
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

  if (!configured) return null;

  return (
    <>
      <HeaderIconButton
        label={t('auth.account')}
        active={open}
        onClick={(event) => {
          setSignInFailed(false);
          setAnchorEl(event.currentTarget);
        }}
      >
        <AccountIcon />
      </HeaderIconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { p: 2, mt: 1 } } }}
      >
        {user ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, minWidth: SIGN_IN_WIDTH }}>
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, width: SIGN_IN_WIDTH }}>
            <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
              {t('auth.signInPrompt')}
            </Typography>
            {/* Our styled button is the visible layer; Google's real button is rendered on top at
                opacity 0 (same width) so the click reaches Google while the player sees our design. */}
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
        )}
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
