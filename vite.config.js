import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Define base automaticamente para GitHub Pages quando em CI
  // Ex.: owner/repo -> base "/repo/"; local dev usa "/"
  base: process.env.GITHUB_REPOSITORY ? `/${process.env.GITHUB_REPOSITORY.split('/').pop()}/` : '/',
  plugins: [react()],
})
