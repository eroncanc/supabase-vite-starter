# web

The Vite + React frontend. Setup, local dev, auth and conventions are in the
[root README](../README.md) and [AGENTS.md](../AGENTS.md).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on http://localhost:5173 |
| `npm run build` | `tsc -b && vite build` |
| `npm test` | vitest |
| `npm run lint` | oxlint |
| `npm run gen:types` | Regenerates `src/types/database.ts` from the local Supabase DB |
