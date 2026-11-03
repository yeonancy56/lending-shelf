import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { pictureMode } from './picture-mode'

// https://vite.dev/config/
// `npm run picture` adds picture mode: pretend answers instead of the server (see picture-mode.js)
export default defineConfig(({ mode }) => ({
  plugins: [react(), mode === 'picture' && pictureMode()],
  server: {
    // while running on my computer: pass /api/books on to the server as /books
    proxy: {
      '/api': {
        target: 'http://localhost:4000', // must match the door number (port) in server/index.js
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  test: {
    environment: 'jsdom', // a pretend browser, so tests can show the page without opening Chrome
    setupFiles: './src/test-setup.js',
  },
}))
