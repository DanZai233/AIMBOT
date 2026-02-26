# AGENTS.md

## Cursor Cloud specific instructions

This is **Aim Trainer Pro**, a client-side React game built with Vite + TypeScript + Tailwind CSS v4. There is no backend server — the app is entirely front-end.

### Services

| Service | Command | Port |
|---------|---------|------|
| Vite Dev Server | `npm run dev` | 3000 |

### Key commands

See `package.json` `scripts` for the full list:

- **Dev server:** `npm run dev` (Vite on port 3000, `--host=0.0.0.0`)
- **Lint:** `npm run lint` (runs `tsc --noEmit`)
- **Build:** `npm run build` (production build to `dist/`)
- **Clean:** `npm run clean` (removes `dist/`)

### Notes

- No automated test suite exists in this project; lint (`tsc --noEmit`) is the primary code-quality check.
- `GEMINI_API_KEY` is referenced in `vite.config.ts` but not consumed by any source code — the app runs fine without it.
- `better-sqlite3`, `express`, `dotenv`, and `@google/genai` are listed as dependencies but are unused in the source code. They may cause native compilation warnings during `npm install` but do not affect the app.
