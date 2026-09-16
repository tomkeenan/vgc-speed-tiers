import { describe, it, expect } from 'vitest';
import { displayName } from './data';

const charizard = {
  name: 'Charizard-Mega-Y',
  names: { fr: 'Méga-Dracaufeu Y', ja: 'リザードン' },
};

describe('displayName', () => {
  it('returns the localized name when present', () => {
    expect(displayName(charizard, 'fr')).toBe('Méga-Dracaufeu Y');
    expect(displayName(charizard, 'ja')).toBe('リザードン');
  });

  it('falls back to the default name when the language is missing', () => {
    expect(displayName(charizard, 'cs')).toBe('Charizard-Mega-Y');
  });

  it('falls back to the default name when there are no localized names', () => {
    expect(displayName({ name: 'Garchomp-Mega-Z' }, 'de')).toBe('Garchomp-Mega-Z');
  });
});
