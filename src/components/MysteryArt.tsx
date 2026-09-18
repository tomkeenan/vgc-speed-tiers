import { useState } from 'react';
import type { SxProps, Theme } from '@mui/material/styles';
import Box from '@mui/material/Box';

interface MysteryArtProps {
  sx?: SxProps<Theme>;
}

// Every Dream World (Gen 5 vector) form of Unown, the "unknown" Pokemon, bundled as hashed assets.
const forms = import.meta.glob<string>('../assets/unown/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
});
const UNOWN_URLS = Object.values(forms);

const randomUnown = () => UNOWN_URLS[Math.floor(Math.random() * UNOWN_URLS.length)];

/**
 * A square placeholder that stands in for a Pokemon's artwork on a masked card: a random form of
 * Unown, the "unknown" Pokemon, picked once per mount and rendered in the same frame PokemonImage
 * uses so a masked card looks like a played one. The art is shown exactly as PokeAPI provides it,
 * unaffected by the theme. Takes optional sx overrides, returns the element.
 */
export function MysteryArt({ sx }: MysteryArtProps) {
  const [src] = useState(randomUnown);
  return (
    <Box
      sx={{ position: 'relative', aspectRatio: '1 / 1', width: '100%', overflow: 'hidden', ...sx }}
    >
      <Box
        component="img"
        src={src}
        alt=""
        aria-hidden
        sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
    </Box>
  );
}
