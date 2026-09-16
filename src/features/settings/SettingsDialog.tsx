import { useMemo, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
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
import { PlusIcon } from '../../components/PlusIcon';
import { PokeballIcon } from '../../components/PokeballIcon';
import {
  loadLanguage,
  saveLanguage,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from '../../language';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

const sectionLabelSx = {
  fontWeight: 600,
} as const;

/** Each language's own endonym, shown regardless of the active UI language. */
const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  'fi-FI': 'Suomi',
};

/**
 * The settings dialog: create, rename, edit, or delete decks. Switching the active deck lives
 * in the header's deck selector, not here.
 * Takes open and onClose, returns the element.
 */
export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const { t, i18n } = useTranslation();
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
  const [language, setLanguage] = useState<SupportedLanguage>(() => loadLanguage());
  const [creating, setCreating] = useState(false);
  const [importingOpen, setImportingOpen] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const changeLanguage = (lang: SupportedLanguage) => {
    setLanguage(lang);
    saveLanguage(lang);
    void i18n.changeLanguage(lang);
  };

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
      setImportError(t('settings.noneInDataset'));
      return;
    }
    createDeck(result.deck.name, known);
    setImportText('');
    setImportError(null);
    setImportingOpen(false);
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
    setCreating(false);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" fullScreen={fullScreen}>
      <DialogTitle
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}
      >
        <Box component="span" sx={{ fontWeight: 700 }}>
          {t('settings.title')}
        </Box>
        <IconButton
          aria-label={t('settings.close')}
          onClick={onClose}
          sx={{ color: 'text.primary' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            <Trans
              i18nKey="settings.explainer"
              components={{
                icon: (
                  <Box
                    component="span"
                    sx={{ display: 'inline-flex', verticalAlign: 'text-bottom', mx: 0.25 }}
                  >
                    <PokeballIcon size={18} />
                  </Box>
                ),
              }}
            />
          </Typography>

          {userDecks.length > 0 && (
            <>
              <Divider />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography component="span" sx={sectionLabelSx}>
                  {t('settings.yourDecks')}
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
                          aria-label={
                            expanded
                              ? t('settings.collapse', { name: deck.name })
                              : t('settings.edit', { name: deck.name })
                          }
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
                            label={t('settings.deckName')}
                            value={deck.name}
                            onChange={(e) => renameDeck(deck.id, e.target.value)}
                            fullWidth
                          />
                          <MemberPicker
                            label={t('settings.pokemon')}
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
                              {copiedId === deck.id ? t('common.copied') : t('settings.exportDeck')}
                            </Button>
                            <Button variant="ghost" onClick={() => deleteDeck(deck.id)}>
                              {t('settings.deleteDeck')}
                            </Button>
                          </Stack>
                        </Stack>
                      </Collapse>
                    </Box>
                  );
                })}
              </Box>
            </>
          )}

          <Divider />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
              }}
            >
              <Typography component="span" sx={sectionLabelSx}>
                {t('settings.createDeck')}
              </Typography>
              <IconButton
                aria-label={creating ? t('settings.cancelCreate') : t('settings.createDeck')}
                aria-expanded={creating}
                onClick={() => setCreating((v) => !v)}
                size="small"
                sx={{ color: 'text.primary' }}
              >
                {creating ? <CloseIcon /> : <PlusIcon />}
              </IconButton>
            </Box>
            <Collapse in={creating} unmountOnExit>
              <Stack spacing={1.5} sx={{ pt: 0.5 }}>
                <TextField
                  label={t('settings.deckName')}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  fullWidth
                />
                <MemberPicker
                  label={t('settings.pokemon')}
                  options={pool}
                  value={newMembers}
                  onChange={setNewMembers}
                />
                <Button
                  onClick={saveNewDeck}
                  disabled={!newName.trim()}
                  sx={{ alignSelf: { sm: 'flex-start' } }}
                >
                  {t('settings.saveDeck')}
                </Button>
              </Stack>
            </Collapse>
          </Box>

          <Divider />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
              }}
            >
              <Typography component="span" sx={sectionLabelSx}>
                {t('settings.importDeck')}
              </Typography>
              <IconButton
                aria-label={importingOpen ? t('settings.cancelCreate') : t('settings.importDeck')}
                aria-expanded={importingOpen}
                onClick={() => setImportingOpen((v) => !v)}
                size="small"
                sx={{ color: 'text.primary' }}
              >
                {importingOpen ? <CloseIcon /> : <PlusIcon />}
              </IconButton>
            </Box>
            <Collapse in={importingOpen} unmountOnExit>
              <Stack spacing={1.5} sx={{ pt: 0.5 }}>
                <TextField
                  label={t('settings.pasteDeckJson')}
                  placeholder={t('settings.pastePlaceholder')}
                  value={importText}
                  onChange={(e) => {
                    setImportText(e.target.value);
                    if (importError) setImportError(null);
                  }}
                  error={!!importError}
                  helperText={importError ?? t('settings.pasteHelper')}
                  multiline
                  minRows={3}
                  fullWidth
                />
                <Button
                  onClick={importDeck}
                  disabled={!importText.trim()}
                  sx={{ alignSelf: { sm: 'flex-start' } }}
                >
                  {t('settings.importButton')}
                </Button>
              </Stack>
            </Collapse>
          </Box>

          <Divider />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography component="span" sx={sectionLabelSx}>
              {t('settings.language')}
            </Typography>
            <TextField
              select
              value={language}
              onChange={(e) => changeLanguage(e.target.value as SupportedLanguage)}
              fullWidth
              aria-label={t('settings.language')}
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <MenuItem key={lang} value={lang}>
                  {LANGUAGE_NAMES[lang]}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
