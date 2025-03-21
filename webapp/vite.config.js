import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
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
