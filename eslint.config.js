import js from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import pluginVue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'
import globals from 'globals'

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,mts,tsx,vue}'],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },
  ...pluginVue.configs['flat/recommended'].map((config) => ({
    ...config,
    files: ['**/*.vue'],
  })),
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
      },
    },
  },
  eslintConfigPrettier,
)
