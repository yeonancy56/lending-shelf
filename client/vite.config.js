import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom', // a pretend browser, so tests can show the page without opening Chrome
    setupFiles: './src/test-setup.js',
  },
})
