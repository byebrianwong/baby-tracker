// Expo's flat ESLint config + deterministic import ordering (project convention).
const expoConfig = require('eslint-config-expo/flat');
const simpleImportSort = require('eslint-plugin-simple-import-sort');

module.exports = [
  ...expoConfig,
  {
    plugins: { 'simple-import-sort': simpleImportSort },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      // Reanimated shared values (`sharedValue.value = …`) are mutable by design;
      // the React Compiler immutability heuristic false-positives on them.
      'react-hooks/immutability': 'off',
    },
  },
  {
    ignores: ['dist/*', '.expo/*', 'node_modules/*'],
  },
];
