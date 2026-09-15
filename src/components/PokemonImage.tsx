import { useState } from 'react';
import type { SxProps, Theme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

interface PokemonImageProps {
  src: string;
  name: string;
  sx?: SxProps<Theme>;
}

/**
 * Responsive Pokemon artwork with a loading skeleton and a fallback on error.
 * Takes a sprite src, the Pokemon name (for alt text), and optional sx overrides, returns the element.
 */
export function PokemonImage({ src, name, sx }: PokemonImageProps) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  return (
    <Box
      sx={{ position: 'relative', aspectRatio: '1 / 1', width: '100%', overflow: 'hidden', ...sx }}
    >
      {status === 'loading' && (
        <Skeleton
          variant="rectangular"
          sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        />
      )}
      {status === 'error' && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.default',
          }}
        >
          <Typography
            sx={{ color: 'text.secondary', fontSize: '0.875rem', textAlign: 'center', px: 1 }}
          >
            {name}
          </Typography>
        </Box>
      )}
      <Box
        component="img"
        src={src}
        alt={name}
        loading="lazy"
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
        sx={(theme) => ({
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          transition: theme.transitions.create('opacity', {
            duration: theme.transitions.duration.shorter,
          }),
          opacity: status === 'loaded' ? 1 : 0,
        })}
      />
    </Box>
  );
}
