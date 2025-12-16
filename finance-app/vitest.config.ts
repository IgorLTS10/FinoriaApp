import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    test: {
        // Utilise happy-dom pour simuler le DOM (plus rapide que jsdom)
        environment: 'happy-dom',

        // Fichier de setup global pour les tests
        setupFiles: ['./src/test/setup.ts'],

        // Inclure les fichiers de test
        include: ['**/*.{test,spec}.{ts,tsx}'],

        // Exclure certains dossiers
        exclude: ['node_modules', 'dist', '.vercel'],

        // Configuration de la couverture de code
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'src/test/',
                '**/*.d.ts',
                '**/*.config.*',
                '**/mockData',
                'dist/',
            ],
        },

        // Globals pour ne pas avoir à importer describe, it, expect dans chaque fichier
        globals: true,
    },

    // Résolution des chemins (comme dans vite.config.ts)
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
})
