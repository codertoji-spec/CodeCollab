import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core — cached separately; rarely changes
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Monaco editor — very large, always lazy-loaded anyway
          'vendor-monaco': ['@monaco-editor/react', 'monaco-editor'],
          // Three.js / OGL — used only on Landing page shaders
          'vendor-three': ['three', 'ogl'],
          // Yjs CRDT + bindings
          'vendor-yjs': ['yjs', 'y-monaco'],
          // Socket.io client
          'vendor-socket': ['socket.io-client'],
        },
      },
    },
  },
})
