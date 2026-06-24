import js from '@eslint/js'
import nextPlugin from '@next/eslint-plugin-next'
import prettierConfig from 'eslint-config-prettier/flat'
import betterTailwindcss from 'eslint-plugin-better-tailwindcss'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

const jsFiles = ['**/*.{js,cjs,mjs,jsx}']
const tsFiles = ['**/*.{ts,cts,mts,tsx}']
const sourceFiles = ['**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}']
const scriptFiles = [
  '*.config.{js,cjs,mjs,ts,cts,mts}',
  'eslint.config.mjs',
  'scripts/**/*.{js,cjs,mjs,ts,cts,mts}',
]

const qualityRules = {
  curly: ['error', 'all'],
  eqeqeq: ['error', 'always'],
  'no-console': 'error',
  'no-else-return': 'error',
  'no-var': 'error',
  'no-warning-comments': ['error', { terms: ['fixme'], location: 'start' }],
  'object-shorthand': ['error', 'always'],
  'prefer-const': 'error',
}

export default defineConfig([
  {
    name: 'template/linter-options',
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
      reportUnusedInlineConfigs: 'error',
    },
  },
  globalIgnores(['.next', 'next-env.d.ts']),
  {
    name: 'template/javascript',
    files: jsFiles,
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.node,
      sourceType: 'module',
    },
  },
  {
    name: 'template/typescript',
    files: tsFiles,
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'no-undef': 'off',
    },
  },
  {
    name: 'template/next',
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      '@next/next': nextPlugin,
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.flat['recommended-latest'].rules,
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },
  {
    name: 'template/better-tailwindcss',
    files: tsFiles,
    plugins: { 'better-tailwindcss': betterTailwindcss },
    settings: {
      'better-tailwindcss': { entryPoint: 'src/app/globals.css' },
    },
    rules: {
      'better-tailwindcss/enforce-canonical-classes': [
        'warn',
        { rootFontSize: 16 },
      ],
      'better-tailwindcss/enforce-consistent-important-position': 'warn',
      'better-tailwindcss/enforce-shorthand-classes': 'warn',
      'better-tailwindcss/no-deprecated-classes': 'warn',
      'better-tailwindcss/no-duplicate-classes': 'warn',
      'better-tailwindcss/no-unnecessary-whitespace': 'warn',
      'better-tailwindcss/no-conflicting-classes': 'error',
    },
  },
  {
    ...prettierConfig,
    name: 'template/prettier',
  },
  {
    name: 'template/source-quality',
    files: sourceFiles,
    rules: {
      ...qualityRules,
    },
  },
  {
    name: 'template/node-scripts',
    files: scriptFiles,
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      'no-console': 'off',
    },
  },
])
