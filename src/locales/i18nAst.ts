import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from '@babel/parser';

/**
 * Shared parsing helper for the i18n parity test. Uses @babel/parser (its own TS/JSX parser, the
 * same one ESLint uses here) so it reads the project's source independently of the installed
 * `typescript` version.
 */

export const SRC_DIR = join(process.cwd(), 'src');

/** Any AST node: a plain object carrying a string `type`. */
export type Node = { type: string } & Record<string, unknown>;

/** Absolute paths of non-test source files under src/ matching the given extensions. */
export function listSources(exts: string[]): string[] {
  return readdirSync(SRC_DIR, { recursive: true })
    .map(String)
    .filter((f) => exts.some((e) => f.endsWith(e)) && !f.includes('.test.'))
    .map((f) => join(SRC_DIR, f));
}

/** Parses a source file into its Babel Program node. */
export function parseProgram(file: string): Node {
  const plugins: ('typescript' | 'jsx')[] = file.endsWith('.tsx')
    ? ['typescript', 'jsx']
    : ['typescript'];
  const ast = parse(readFileSync(file, 'utf8'), { sourceType: 'module', plugins });
  return ast.program as unknown as Node;
}

/** Depth-first visits every AST node reachable from `root`. */
export function walk(root: Node, visit: (node: Node) => void): void {
  const seen = (value: unknown): value is Node =>
    !!value && typeof value === 'object' && typeof (value as Node).type === 'string';

  const recurse = (node: unknown) => {
    if (Array.isArray(node)) {
      for (const child of node) recurse(child);
      return;
    }
    if (!node || typeof node !== 'object') return;
    if (seen(node)) visit(node);
    for (const [key, value] of Object.entries(node)) {
      if (key === 'loc' || key === 'start' || key === 'end' || key.endsWith('Comments')) continue;
      recurse(value);
    }
  };
  recurse(root);
}
