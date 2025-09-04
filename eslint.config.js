/**
 * ESLint Configuration for War Room Frontend
 * Enhanced for React, TypeScript, and Accessibility
 */

import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import react from 'eslint-plugin-react';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'build/**',
      'node_modules/**',
      'coverage/**',
      '*.config.js',
      '*.config.ts',
      'public/**',
      'dev-server.log',
    ],
  },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      react.configs.flat.recommended,
      react.configs.flat['jsx-runtime'],
      jsxA11y.flatConfigs.recommended,
    ],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.es2020,
        ...globals.node,
      },
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        // project: './tsconfig.json',
        // tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      react,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      
      // React specific rules
      'react/react-in-jsx-scope': 'off', // Not needed with new JSX transform
      'react/jsx-uses-react': 'off', // Not needed with new JSX transform
      'react/prop-types': 'off', // Using TypeScript for prop validation
      'react/display-name': 'warn',
      'react/no-unescaped-entities': 'warn',
      'react/jsx-key': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-undef': 'error',
      'react/jsx-uses-vars': 'error',
      'react/no-danger': 'warn',
      'react/no-deprecated': 'warn',
      'react/no-direct-mutation-state': 'error',
      'react/no-is-mounted': 'error',
      'react/no-render-return-value': 'error',
      'react/no-string-refs': 'error',
      'react/no-this-in-sfc': 'error',
      'react/no-unknown-property': 'error',
      'react/no-unused-prop-types': 'warn',
      'react/no-unused-state': 'warn',
      'react/prefer-es6-class': 'warn',
      'react/require-render-return': 'error',
      'react/self-closing-comp': 'warn',
      'react/sort-comp': 'warn',
      'react/style-prop-object': 'warn',
      'react/void-dom-elements-no-children': 'error',
      
      // React Hooks rules
      'react-hooks/rules-of-hooks': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      
      // React Refresh rules
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      
      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-empty-function': 'warn',
      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/no-inferrable-types': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      // '@typescript-eslint/no-unnecessary-type-assertion': 'warn', // Requires type checking
      '@typescript-eslint/prefer-as-const': 'warn',
      '@typescript-eslint/prefer-for-of': 'warn',
      '@typescript-eslint/prefer-function-type': 'warn',
      // '@typescript-eslint/prefer-includes': 'warn', // Requires type checking
      // '@typescript-eslint/prefer-string-starts-ends-with': 'warn', // Requires type checking
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
        },
      ],
      
      // Accessibility rules (jsx-a11y)
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-has-content': 'error',
      'jsx-a11y/anchor-is-valid': 'warn',
      'jsx-a11y/aria-activedescendant-has-tabindex': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-proptypes': 'error',
      'jsx-a11y/aria-role': 'error',
      'jsx-a11y/aria-unsupported-elements': 'error',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/heading-has-content': 'warn',
      'jsx-a11y/html-has-lang': 'error',
      'jsx-a11y/iframe-has-title': 'error',
      'jsx-a11y/img-redundant-alt': 'error',
      'jsx-a11y/interactive-supports-focus': 'warn',
      'jsx-a11y/label-has-associated-control': 'warn',
      'jsx-a11y/lang': 'error',
      'jsx-a11y/media-has-caption': 'warn',
      'jsx-a11y/mouse-events-have-key-events': 'warn',
      'jsx-a11y/no-access-key': 'error',
      'jsx-a11y/no-autofocus': 'warn',
      'jsx-a11y/no-distracting-elements': 'error',
      'jsx-a11y/no-interactive-element-to-noninteractive-role': 'error',
      'jsx-a11y/no-noninteractive-element-interactions': 'warn',
      'jsx-a11y/no-noninteractive-element-to-interactive-role': 'error',
      'jsx-a11y/no-noninteractive-tabindex': 'warn',
      'jsx-a11y/no-redundant-roles': 'error',
      'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/role-supports-aria-props': 'error',
      'jsx-a11y/scope': 'error',
      'jsx-a11y/tabindex-no-positive': 'error',
      
      // General JavaScript/TypeScript rules
      'no-console': 'off', // Allow console statements in development
      'no-debugger': 'error',
      'no-alert': 'warn',
      'no-unused-vars': 'off', // Handled by @typescript-eslint/no-unused-vars
      'no-var': 'error',
      'prefer-const': 'warn',
      'prefer-template': 'warn',
      'object-shorthand': 'warn',
      'prefer-arrow-callback': 'warn',
      'arrow-spacing': 'warn',
      'prefer-destructuring': 'off', // Too noisy
      'no-duplicate-imports': 'off', // Can be useful for type imports
      'no-useless-return': 'warn',
      'no-useless-catch': 'warn',
      'no-useless-computed-key': 'warn',
      'no-useless-concat': 'warn',
      'no-useless-rename': 'warn',
      'no-useless-escape': 'warn',
      'no-multiple-empty-lines': ['warn', { max: 2 }],
      // Formatting rules disabled - using Prettier
      // 'no-trailing-spaces': 'warn',
      // 'comma-dangle': ['warn', 'always-multiline'],
      // 'semi': ['warn', 'always'],
      // 'quotes': ['warn', 'single', { avoidEscape: true }],
      // 'indent': ['warn', 2, { SwitchCase: 1 }],
      // 'max-len': ['warn', { code: 100, ignoreUrls: true, ignoreStrings: true }],
      // 'eol-last': ['warn', 'always'],
      // 'no-mixed-spaces-and-tabs': 'warn',
      // 'keyword-spacing': 'warn', // Prettier handles this
      // 'space-before-blocks': 'warn', // Prettier handles this
      // 'space-infix-ops': 'warn', // Prettier handles this
      // 'space-unary-ops': 'warn', // Prettier handles this
      // 'brace-style': ['warn', '1tbs', { allowSingleLine: true }], // Prettier handles this
      'curly': ['warn', 'all'],
      'eqeqeq': ['error', 'always'],
      'no-eq-null': 'error',
      'no-implicit-coercion': 'warn',
      'no-magic-numbers': 'off', // Too noisy for practical use
      'radix': 'off', // Not critical for modern JS
      'yoda': 'error',
      
      // Performance and best practices
      'no-loop-func': 'warn',
      'no-new-func': 'error',
      'no-new-object': 'error',
      'no-new-wrappers': 'error',
      'no-proto': 'error',
      'no-script-url': 'warn',
      'no-sequences': 'error',
      'no-throw-literal': 'warn',
      'no-void': 'error',
      'no-with': 'error',
      'wrap-iife': ['error', 'any'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-extend-native': 'error',
      'no-iterator': 'error',
      'no-labels': 'error',
      'no-lone-blocks': 'error',
      'no-multi-str': 'error',
      'no-native-reassign': 'error',
      'no-new': 'warn',
      'no-octal': 'error',
      'no-octal-escape': 'error',
      'no-param-reassign': 'warn',
      'no-redeclare': 'warn',
      'no-return-assign': 'warn',
      'no-self-compare': 'error',
      'no-undef-init': 'error',
      'no-unused-expressions': 'warn',
      'no-use-before-define': 'off', // TypeScript handles this better
      'consistent-return': 'warn',
      'default-case': 'warn',
      'dot-notation': 'warn',
      'guard-for-in': 'warn',
      'no-caller': 'error',
      'no-case-declarations': 'warn',
      'no-div-regex': 'error',
      'no-else-return': 'warn',
      'no-empty-pattern': 'error',
      'no-fallthrough': 'error',
      
      // Additional rules to allow warnings instead of errors
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-unsafe-function-type': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      'no-constant-binary-expression': 'warn',
      '@typescript-eslint/no-unused-expressions': 'warn',
      'no-empty': 'warn',
      'no-constant-condition': 'warn',
      '@typescript-eslint/no-namespace': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      // Duplicated rules removed
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
);