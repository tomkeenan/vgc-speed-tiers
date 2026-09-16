import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import en from './en.json';
import { SRC_DIR, listSources, parseProgram, walk, type Node } from './i18nAst';

/**
 * Guard: translation keys stay in sync.
 *  1. Every static `t('key')` / `<Trans i18nKey="key">` used in src resolves to a key in en.json.
 *  2. Every other locale file has exactly the same key set as en.json (no missing, no orphan keys).
 * Dynamic keys (a non-literal first arg to `t`) are skipped - they cannot be checked statically.
 */

const LOCALES = join(SRC_DIR, 'locales');
/** i18next plural/context suffixes an en key may carry while code calls the base key. */
const SUFFIXES = ['', '_zero', '_one', '_two', '_few', '_many', '_other'];

/** Flattens a nested translation object into dot-path keys. */
function flatten(obj: Record<string, unknown>, prefix = ''): Set<string> {
  const keys = new Set<string>();
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      for (const nested of flatten(v as Record<string, unknown>, path)) keys.add(nested);
    } else {
      keys.add(path);
    }
  }
  return keys;
}

/** Extracts every static translation key referenced via t() / i18n.t() / <Trans i18nKey>. */
function usedKeys(): Set<string> {
  const keys = new Set<string>();
  for (const file of listSources(['.ts', '.tsx'])) {
    walk(parseProgram(file), (node: Node) => {
      if (node.type === 'CallExpression') {
        const callee = node.callee as Node;
        const name =
          callee?.type === 'Identifier'
            ? (callee.name as string)
            : callee?.type === 'MemberExpression' && !callee.computed
              ? ((callee.property as Node)?.name as string)
              : '';
        const arg = (node.arguments as Node[])?.[0];
        if (name === 't' && arg?.type === 'StringLiteral') keys.add(arg.value as string);
      }
      if (node.type === 'JSXAttribute' && (node.name as Node)?.name === 'i18nKey') {
        const value = node.value as Node;
        if (value?.type === 'StringLiteral') keys.add(value.value as string);
      }
    });
  }
  return keys;
}

const enKeys = flatten(en as Record<string, unknown>);
const resolves = (key: string) => SUFFIXES.some((s) => enKeys.has(key + s));

const localeFiles = readdirSync(LOCALES)
  .filter((f) => f.endsWith('.json') && f !== 'en.json')
  .map((f) => join(LOCALES, f));

describe('i18n key parity', () => {
  it('every t() / <Trans> key used in src exists in en.json', () => {
    const missing = [...usedKeys()].filter((k) => !resolves(k)).sort();
    expect(
      missing,
      `\nKeys used in code but absent from en.json:\n${missing.join('\n')}\n`,
    ).toEqual([]);
  });

  it.each(localeFiles)('%s has the same keys as en.json', (file: string) => {
    const localeKeys = flatten(JSON.parse(readFileSync(file, 'utf8')));
    const missing = [...enKeys].filter((k) => !localeKeys.has(k)).sort();
    const orphan = [...localeKeys].filter((k) => !enKeys.has(k)).sort();
    expect(
      { missing, orphan },
      `\n${file}\n  missing (in en, not here): ${missing.join(', ') || 'none'}\n  orphan (here, not in en): ${orphan.join(', ') || 'none'}\n`,
    ).toEqual({ missing: [], orphan: [] });
  });
});
