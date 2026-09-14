import { useState } from 'react';

interface PokemonImageProps {
  src: string;
  name: string;
  className?: string;
}

/**
 * Responsive Pokemon artwork with a loading shimmer and a fallback on error.
 * Takes a sprite src, the Pokemon name (for alt text), and optional classes, returns the element.
 */
export function PokemonImage({ src, name, className = '' }: PokemonImageProps) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  return (
    <div className={`relative aspect-square w-full overflow-hidden ${className}`}>
      {status !== 'loaded' && (
        <div className="bg-surface-muted absolute inset-0 flex items-center justify-center">
          {status === 'loading' ? (
            <div className="bg-ink/5 h-2/3 w-2/3 animate-pulse rounded-full" />
          ) : (
            <span className="text-ink-muted px-2 text-center text-sm">{name}</span>
          )}
        </div>
      )}
      <img
        src={src}
        alt={name}
        loading="lazy"
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
        className={`h-full w-full object-contain transition-opacity duration-200 ${
          status === 'loaded' ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}
