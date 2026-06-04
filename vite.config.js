import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react(),
    ],
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        return 'vendor';
                    }
                    if (id.includes('/Pages/Auth/') || id.includes('/Pages/Welcome')) return 'pages-auth';
                    if (id.includes('/Pages/'))         return 'pages-misc';
                    if (id.includes('/Components/') || id.includes('/Layouts/')) return 'ui';
                    if (id.includes('/Hooks/') || id.includes('/Utils/'))         return 'utils';
                },
            },
        },
    },
});
