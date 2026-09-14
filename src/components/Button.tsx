import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-dark',
  ghost: 'bg-surface text-ink border border-ink/10 hover:bg-surface-muted',
};

/**
 * A tappable button. Full-width on mobile, auto-width from sm up.
 * Takes standard button props plus an optional variant, returns the element.
 */
export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`w-full rounded-xl px-5 py-3 text-base font-semibold transition-colors sm:w-auto ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}
