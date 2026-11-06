import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig([
    globalIgnores(['**/dist/**', '**/coverage/**', '.cache/**']),
    {
        files: ['**/*.{js,mjs,cjs}'],
        extends: [js.configs.recommended],
    },
    {
        files: ['**/*.{ts,tsx,mts,cts}'],
        extends: [js.configs.recommended, tseslint.configs.recommended],
    },
    {
        rules: {
            curly: ['error', 'all'],
        },
    },
]);
