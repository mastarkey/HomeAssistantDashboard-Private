import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Vite configuration for Home Assistant custom panel build
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  build: {
    outDir: 'dist-ha',
    lib: {
      entry: 'src/ha-panel-wrapper.ts',
      name: 'ReactDashboardPanel',
      fileName: 'react-dashboard-panel',
      formats: ['es']
    },
    rollupOptions: {
      external: [],
      output: {
        assetFileNames: '[name][extname]',
        chunkFileNames: '[name].js',
        entryFileNames: '[name].js',
      }
    },
    sourcemap: true,
    minify: false,
    cssCodeSplit: false,
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  }
})