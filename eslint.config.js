// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierPlugin = require('eslint-plugin-prettier');
const simpleImportSort = require('eslint-plugin-simple-import-sort');
const js = require('@eslint/js');

const importSortGroups = [
  ['^react', '^react-native'],
  ['^@?\\w'],
  ['^@/'],
  ['^\\./'],
];

const baseRules = {
  'react/jsx-indent': ['error', 2],
  'arrow-body-style': ['error', 'as-needed'],
  'react/function-component-definition': 0,
  'react/button-has-type': 0,
  'react/jsx-filename-extension': [1, { extensions: ['.tsx', '.ts'] }],
  'react/prop-types': 0,
  'react/react-in-jsx-scope': 'off',
  'no-undef': 'off',
  'no-console': 'off',
  '@typescript-eslint/explicit-module-boundary-types': 'off',
  'import/extensions': [0, 'ignorePackages', { ts: 'never', tsx: 'never' }],
  'import/prefer-default-export': 'off',
  'import/no-unresolved': 'off',
  'react/require-default-props': 'off',
  '@typescript-eslint/no-explicit-any': 'off',
  'no-unused-expressions': 'off',
  'react/jsx-no-useless-fragment': 'off',
  'no-nested-ternary': 'off',
  'no-restricted-globals': 'off',
  'import/order': 'off',
  'tsdoc/syntax': 'off',
  'no-param-reassign': 'off',
  'react/no-unescaped-entities': 'off',
  'no-unused-vars': 'off',
  '@typescript-eslint/no-unused-vars': 'off',
  'prettier/prettier': 'error',
  'simple-import-sort/imports': [
    'error',
    {
      groups: importSortGroups,
    },
  ],
};

module.exports = defineConfig([
  {
    ignores: ['dist/*', 'node_modules/*', '*.config.js'],
  },
  js.configs.recommended,
  expoConfig,
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
      prettier: prettierPlugin,
    },
    rules: baseRules,
  },
  {
    files: ['**/*.tsx'],
    rules: {
      ...baseRules,
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            ['^react', '^react-native'],
            ['^@?\\w'],
            ['^@/'],
            ['^\\./'],
          ],
        },
      ],
      'prettier/prettier': 'off',
    },
  },
]);

