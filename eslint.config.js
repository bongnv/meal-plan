import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import unicorn from 'eslint-plugin-unicorn'
import importPlugin from 'eslint-plugin-import'

export default tseslint.config(
  { ignores: ['dist', 'coverage', '*.config.ts', '*.config.js'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      unicorn: unicorn,
      import: importPlugin,
    },
    settings: {
      'import/resolver': {
        typescript: true,
        node: true,
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      // Enforce async/await patterns for better error handling and readability
      // Allow promise-returning event handlers (common React pattern)
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: {
            attributes: false, // Allow promise-returning event handlers like onClick
            properties: false,
            returns: true,
            variables: true,
          },
        },
      ],
      // Require promises to be awaited or explicitly handled
      // Use `void` operator for intentional fire-and-forget: void somePromise()
      '@typescript-eslint/no-floating-promises': [
        'error',
        {
          ignoreVoid: true, // Allow: void somePromise() for fire-and-forget
          ignoreIIFE: true, // Allow immediately invoked function expressions
        },
      ],
      // Enforce async/await over promise chains (.then/.catch)
      // Ensures consistent promise handling patterns across codebase
      '@typescript-eslint/promise-function-async': [
        'error',
        {
          allowedPromiseNames: ['Thenable'],
          checkArrowFunctions: true,
          checkFunctionDeclarations: true,
          checkFunctionExpressions: true,
          checkMethodDeclarations: true,
        },
      ],
      'import/default': 'off',
      'import/no-named-as-default-member': 'off',
      'unicorn/filename-case': [
        'error',
        {
          cases: {
            pascalCase: true,
            camelCase: true,
            kebabCase: true,
          },
          ignore: ['^vite-env\\.d\\.ts$'],
        },
      ],
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'object',
            'type',
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
    },
  },
  // Disable react-refresh warning for context files
  // It's standard practice to export both provider and hook from the same file
  {
    files: ['src/contexts/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  }
)
