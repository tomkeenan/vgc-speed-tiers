import babelParser from '@babel/eslint-parser';
import i18next from 'eslint-plugin-i18next';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'tools/**',
      '**/*.mjs',
      '**/*.test.ts',
      '**/*.test.tsx',
    ],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    // This config gates i18n only; react-hooks is off, so its existing disable directives read as
    // "unused". Don't report that here.
    linterOptions: { reportUnusedDisableDirectives: 'off' },
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: ['@babel/preset-typescript', '@babel/preset-react'],
        },
      },
    },
    // react-hooks is registered only so existing `// eslint-disable react-hooks/*` directives in
    // the source resolve; its rules are intentionally not enabled here. This config gates i18n only.
    plugins: { i18next, 'react-hooks': reactHooks },
    rules: {
      'i18next/no-literal-string': [
        'error',
        {
          mode: 'jsx-text-only',
          'jsx-attributes': {
            include: ['aria-label', 'placeholder', 'title', 'alt', 'label'],
          },
        },
      ],
    },
  },
];
