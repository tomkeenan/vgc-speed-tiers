import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useMediaQuery, useTheme } from '@mui/material';
import { getAllPokemon } from '../../lib/data';
import type { Pokemon } from '../../lib/types';
import { useDecks } from '../../decks/DecksContext';
import { ALL_DECK_ID } from '../../decks/store';
import { Button } from '../../components/Button';
import { CloseIcon } from '../../components/CloseIcon';
import { MemberPicker } from '../../components/MemberPicker';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

const sectionLabelSx = {
  fontSize: '0.75rem',
  fontWeight: 600,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  color: 'text.secondary',
} as const;

/**
 * The settings dialog: choose the active deck and create, rename, edit, or delete decks.
 * Takes open and onClose, returns the element.
 */
export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { decks, activeDeckId, setActiveDeck, createDeck, renameDeck, setDeckMembers, deleteDeck } =
    useDecks();

  const pool = useMemo(() => getAllPokemon(), []);
  const byId = useMemo(() => new Map(pool.map((p) => [p.id, p])), [pool]);
  const membersOf = (ids: string[]) =>
    ids.map((id) => byId.get(id)).filter((p): p is Pokemon => !!p);

  const [newName, setNewName] = useState('');
  const [newMembers, setNewMembers] = useState<Pokemon[]>([]);

  const userDecks = decks.filter((d) => !d.isBuiltIn);
  const deckSize = (id: string, ids: string[]) => (id === ALL_DECK_ID ? pool.length : ids.length);

  const saveNewDeck = () => {
    const name = newName.trim();
    if (!name) return;
    createDeck(
      name,
      newMembers.map((p) => p.id),
    );
    setNewName('');
    setNewMembers([]);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" fullScreen={fullScreen}>
      <DialogTitle
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}
      >
        <Box component="span" sx={{ fontWeight: 700 }}>
          Settings
        </Box>
        <IconButton aria-label="Close" onClick={onClose} sx={{ color: 'text.primary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography component="span" sx={sectionLabelSx}>
              Deck for flashcards &amp; who&apos;s faster
            </Typography>
            <RadioGroup value={activeDeckId} onChange={(e) => setActiveDeck(e.target.value)}>
              {decks.map((deck) => (
                <FormControlLabel
                  key={deck.id}
                  value={deck.id}
                  control={<Radio />}
                  label={`${deck.name} · ${deckSize(deck.id, deck.pokemonIds)}`}
                />
              ))}
            </RadioGroup>
          </Box>

          {userDecks.length > 0 && (
            <>
              <Divider />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography component="span" sx={sectionLabelSx}>
                  Your decks
                </Typography>
                {userDecks.map((deck) => (
                  <Box
                    key={deck.id}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.5,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: '12px',
                      p: 2,
                    }}
                  >
                    <TextField
                      label="Deck name"
                      value={deck.name}
                      onChange={(e) => renameDeck(deck.id, e.target.value)}
                      fullWidth
                    />
                    <MemberPicker
                      label="Pokemon"
                      options={pool}
                      value={membersOf(deck.pokemonIds)}
                      onChange={(next) =>
                        setDeckMembers(
                          deck.id,
                          next.map((p) => p.id),
                        )
                      }
                    />
                    <Button
                      variant="ghost"
                      onClick={() => deleteDeck(deck.id)}
                      sx={{ alignSelf: { sm: 'flex-start' } }}
                    >
                      Delete deck
                    </Button>
                  </Box>
                ))}
              </Box>
            </>
          )}

          <Divider />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography component="span" sx={sectionLabelSx}>
              Create a deck
            </Typography>
            <TextField
              label="Deck name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              fullWidth
            />
            <MemberPicker
              label="Pokemon"
              options={pool}
              value={newMembers}
              onChange={setNewMembers}
            />
            <Button
              onClick={saveNewDeck}
              disabled={!newName.trim()}
              sx={{ alignSelf: { sm: 'flex-start' } }}
            >
              Save deck
            </Button>
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
