/// <reference types="vitest/config" />
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
    // lib/supabase.ts throws at import time on missing config, and the pure
    // modules under test reach it transitively -- every lib/<table>.ts file
    // holds its query functions next to its helpers. These placeholders keep
    // the suite from depending on a real .env.local; nothing under test ever
    // makes a request.
    env: {
      VITE_SUPABASE_URL: 'http://localhost:54321',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'test-key-not-used',
    },
    reporters: process.env.GITHUB_ACTIONS
    ? ['default', 'github-actions']
    : ['default']
  },
})
