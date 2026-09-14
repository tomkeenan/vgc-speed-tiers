import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/**
 * A padded surface panel with consistent rounding and a subtle border.
 * Takes children plus standard div props, returns the element.
 */
export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div
      className={`border-ink/10 bg-surface rounded-2xl border p-5 shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
