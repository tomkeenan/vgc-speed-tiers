import { useMemo, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useMediaQuery, useTheme } from '@mui/material';
import { getAllPokemon } from '../../lib/data';
import type { Pokemon } from '../../lib/types';
import { useDecks } from '../../decks/DecksContext';
import { ALL_DECK_ID } from '../../decks/store';
import { parseDeckJson, serializeDeck } from '../../decks/deckIO';
import { Button } from '../../components/Button';
import { CloseIcon } from '../../components/CloseIcon';
import { EditIcon } from '../../components/EditIcon';
import { MemberPicker } from '../../components/MemberPicker';
import { PokeballIcon } from '../../components/PokeballIcon';

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
 * The settings dialog: create, rename, edit, or delete decks. Switching the active deck lives
 * in the header's deck selector, not here.
 * Takes open and onClose, returns the element.
 */
export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { decks, createDeck, renameDeck, setDeckMembers, deleteDeck } = useDecks();

  const pool = useMemo(() => getAllPokemon(), []);
  const byId = useMemo(() => new Map(pool.map((p) => [p.id, p])), [pool]);
  const membersOf = (ids: string[]) =>
    ids.map((id) => byId.get(id)).filter((p): p is Pokemon => !!p);

  const [newName, setNewName] = useState('');
  const [newMembers, setNewMembers] = useState<Pokemon[]>([]);
  const [editing, setEditing] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const copyDeck = async (id: string, name: string, pokemonIds: string[]) => {
    try {
      await navigator.clipboard.writeText(serializeDeck(name, pokemonIds));
      setCopiedId(id);
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopiedId(null), 1500);
    } catch {
      setCopiedId(null);
    }
  };

  const importDeck = () => {
    const result = parseDeckJson(importText);
    if (!result.ok) {
      setImportError(result.error);
      return;
    }
    const known = result.deck.pokemonIds.filter((id) => byId.has(id));
    if (known.length === 0) {
      setImportError('None of those Pokemon are in the current dataset.');
      return;
    }
    createDeck(result.deck.name, known);
    setImportText('');
    setImportError(null);
  };

  const toggleEditing = (id: string) =>
    setEditing((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

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
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            A deck is a custom list of Pokemon. Pick one from the{' '}
            <Box
              component="span"
              sx={{ display: 'inline-flex', verticalAlign: 'text-bottom', mx: 0.25 }}
            >
              <PokeballIcon size={18} />
            </Box>{' '}
            menu in the header to use only those Pokemon in each game mode. The built-in All Pokemon
            deck uses the full dataset. Streaks are tied to each deck and mode, so don&apos;t panic
            if switching deck resets your streak. Create, edit, and share your own decks below.
          </Typography>

          {userDecks.length > 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography component="span" sx={sectionLabelSx}>
                Your decks
              </Typography>
              {userDecks.map((deck) => {
                const expanded = editing.has(deck.id);
                return (
                  <Box
                    key={deck.id}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: '12px',
                      p: 1.5,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1,
                      }}
                    >
                      <Typography sx={{ fontWeight: 600, minWidth: 0 }} noWrap>
                        {deck.name}
                        <Box component="span" sx={{ color: 'text.secondary', fontWeight: 400 }}>
                          {` · ${deckSize(deck.id, deck.pokemonIds)}`}
                        </Box>
                      </Typography>
                      <IconButton
                        aria-label={`${expanded ? 'Collapse' : 'Edit'} ${deck.name}`}
                        aria-expanded={expanded}
                        onClick={() => toggleEditing(deck.id)}
                        size="small"
                        sx={{ color: 'text.primary', flexShrink: 0 }}
                      >
                        {expanded ? <CloseIcon /> : <EditIcon />}
                      </IconButton>
                    </Box>

                    <Collapse in={expanded} unmountOnExit>
                      <Stack spacing={1.5} sx={{ pt: 1.5 }}>
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
                        <Stack
                          direction={{ xs: 'column', sm: 'row' }}
                          spacing={1}
                          sx={{ alignSelf: { sm: 'flex-start' } }}
                        >
                          <Button
                            variant="ghost"
                            onClick={() => copyDeck(deck.id, deck.name, deck.pokemonIds)}
                          >
                            {copiedId === deck.id ? 'Copied!' : 'Export deck'}
                          </Button>
                          <Button variant="ghost" onClick={() => deleteDeck(deck.id)}>
                            Delete deck
                          </Button>
                        </Stack>
                      </Stack>
                    </Collapse>
                  </Box>
                );
              })}
            </Box>
          )}

          {userDecks.length > 0 && <Divider />}
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

          <Divider />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography component="span" sx={sectionLabelSx}>
              Import a deck
            </Typography>
            <TextField
              label="Paste deck JSON"
              placeholder={'{ "name": "My deck", "pokemonIds": ["garchomp", "..."] }'}
              value={importText}
              onChange={(e) => {
                setImportText(e.target.value);
                if (importError) setImportError(null);
              }}
              error={!!importError}
              helperText={importError ?? 'Paste JSON copied from a deck above.'}
              multiline
              minRows={3}
              fullWidth
            />
            <Button
              onClick={importDeck}
              disabled={!importText.trim()}
              sx={{ alignSelf: { sm: 'flex-start' } }}
            >
              Import deck
            </Button>
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
