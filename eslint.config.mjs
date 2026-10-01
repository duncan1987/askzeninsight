import { defineConfig, globalIgnores } from 'eslint/config'
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

export default defineConfig([
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    // Same file scope eslint-config-next uses to register its plugins
    // (notably missing: .cjs — linting scripts/*.cjs with react-hooks
    // rules set off "plugin not defined" since the plugin object only
    // attaches to the file types above).
    files: ['**/*.{js,jsx,mjs,ts,tsx,mts,cts}'],
    rules: {
      // Pragmatic baseline for this codebase (first time linted):
      // real issues are surfaced as warnings so `pnpm lint` stays green
      // while leaving targeted fixes to follow-up changes.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@next/next/no-html-link-for-pages': 'warn',
      // New react-hooks v6 compiler-derived rules; the v0-generated
      // components predate them.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/immutability': 'warn',
    },
  },
  {
    files: [
      'jest.config.js',
      'scripts/**',
      'tests/**',
      '**/*.cjs',
    ],
    rules: {
      // CJS require() is the norm in scripts / jest configs / test helpers.
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  globalIgnores([
    '.next/**',
    'node_modules/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'dev-server.log',
    'public/**',
  ]),
])
