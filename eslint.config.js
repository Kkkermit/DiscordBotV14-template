const js = require('@eslint/js');
const { defineConfig, globalIgnores } = require('eslint/config');
const prettier = require('eslint-config-prettier/flat');
const globals = require('globals');

module.exports = defineConfig([
	globalIgnores(['node_modules/', 'coverage/', 'website/dist/', 'website/.astro/']),
	js.configs.recommended,
	{
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'commonjs',
			globals: globals.node,
		},
		linterOptions: {
			reportUnusedDisableDirectives: 'error',
		},
		rules: {
			curly: ['error', 'multi-line'],
			eqeqeq: ['error', 'always'],
			'no-implicit-globals': 'error',
			'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
			'no-var': 'error',
			'object-shorthand': 'error',
			'prefer-const': 'error',
			'prefer-template': 'error',
		},
	},
	// The docs website (website/) uses ES modules, like most Astro projects.
	{
		files: ['**/*.mjs'],
		languageOptions: { sourceType: 'module' },
	},
	// Turns off stylistic rules that would conflict with Prettier. Keep this last.
	prettier,
]);
