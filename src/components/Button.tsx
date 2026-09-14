import MuiButton, { type ButtonProps as MuiButtonProps } from '@mui/material/Button';

type Variant = 'primary' | 'ghost';

interface ButtonProps extends Omit<MuiButtonProps, 'variant' | 'color'> {
  variant?: Variant;
}

/**
 * A tappable button. Full-width on mobile, auto-width from sm up.
 * Takes standard MUI button props plus an optional variant, returns the element.
 */
export function Button({ variant = 'primary', sx, ...props }: ButtonProps) {
  return (
    <MuiButton
      variant={variant === 'primary' ? 'contained' : 'outlined'}
      color={variant === 'primary' ? 'primary' : 'inherit'}
      disableElevation
      size="large"
      sx={{ width: { xs: '100%', sm: 'auto' }, px: 2.5, py: 1.5, ...sx }}
      {...props}
    />
  );
}
