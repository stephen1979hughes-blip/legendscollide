import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // The match engine lives outside web/ so it can be swapped for a
      // Rust/WASM build without touching the app. Repoint this alias when
      // that lands.
      '@fm/match-engine': path.resolve(here, '../packages/match-engine/src/index.ts')
    }
  },
  server: {
    port: 5173,
    open: true,
    // packages/ sits outside the Vite root, so it must be explicitly allowed.
    fs: {
      allow: [path.resolve(here, '..')]
    },
    watch: {
      usePolling: true,
      interval: 100
    }
  },
  optimizeDeps: {
    exclude: ['./src']
  }
})
