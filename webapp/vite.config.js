import {defineConfig} from 'vite'
import {svelte} from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        svelte(),
        tailwindcss(),
    ],
    base: './', // Use relative paths in the build output
    build: {
        outDir: 'dist',
        sourcemap: true,
        // Ensure all assets are included in the build
        assetsDir: 'assets',
        // Generate a single bundle file
        rollupOptions: {
            output: {
                manualChunks: undefined
            }
        },
        // Ensure dependencies are properly bundled
        commonjsOptions: {
            include: [/node_modules/]
        }
    },
    optimizeDeps: {
        include: ['svelte', 'marked']
    }
})
