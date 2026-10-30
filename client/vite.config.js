import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // while running on my computer: pass /api/books on to the server as /books
    proxy: {
      '/api': {
        target: 'http://localhost:4000', // must match the door number in server/index.js
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  test: {
    environment: 'jsdom', // a pretend browser, so tests can show the page without opening Chrome
    setupFiles: './src/test-setup.js',
  },
})
