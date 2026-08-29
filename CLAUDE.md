# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A football match simulator: pick two classic teams (Man Utd 1968, Brazil 1970, …), simulate a match, watch it play out as a live broadcast. A static React SPA with the simulation in a separate package. There is no deployed backend.

## Commands

### Frontend (`web/`)
```bash
npm run dev      # Vite dev server on :5173 (auto-opens browser)
npm run build    # tsc && vite build -> web/dist (static)
npm run lint     # eslint, --max-warnings 0
```
`web/dev-clean.ps1` kills all node processes, clears `node_modules/.vite` and `dist`, then restarts dev — use it when Vite serves stale modules (the dev server runs with `usePolling` because of Windows watch flakiness).

### Match engine (`packages/match-engine/`)
```bash
npm test         # node --test; determinism + behaviour suite
```
The tests import `.ts` sources directly and rely on Node's native type stripping (Node 22.6+/23+). This is the only real test suite in the repo.

### Admin server (`api/`)
```bash
npm run dev      # Express on :3000, node --watch
```
Local development only — it is the only writer of the data file. Not deployed, not needed to run the app.

## Architecture

### One dataset, one engine, no backend
`web/public/teams-data-normalized.json` is the **single source of truth**: `countries`, `clubs`, `nationalTeams`, `players`, `classicTeams` (26 teams, 416 players, bios on players). Everything reads it:

- `utils/dataProcessor.ts` fetches and denormalizes it into the app's `Club[]` / `Team[]`
- `services/api.ts` wraps that in a cached store and exposes `getTeams` / `getTeam` / `simulateMatch`

`services/api.ts` is named for history, not behaviour — it makes no network calls. It is the seam where data access and engine invocation meet, so keep new data access there rather than fetching JSON from components.

### The engine is deliberately separable
`packages/match-engine/` has no dependency on React or on `web/src/types`. It defines its own `EngineTeam` / `EnginePlayer` / `MatchResult` and is consumed only through the `MatchEngine` interface, so a Rust/WASM implementation can replace it by satisfying the same contract. `services/api.ts` adapts the app's `Team` to `EngineTeam` at the call site — that adapter is the only coupling point.

Resolution is by **Vite alias**, not npm workspace: `@fm/match-engine` maps to `packages/match-engine/src/index.ts` in `web/vite.config.ts`, with a matching `paths` entry in `web/tsconfig.json` and `server.fs.allow` widened to the repo root. Internal engine imports carry explicit `.ts` extensions so Node's test runner, Vite, and both tsconfigs all resolve them. To swap in a WASM engine, repoint the alias and the `defaultEngine` export.

**Matches are deterministic.** Every random draw goes through the seeded `Rng` (mulberry32) in `packages/match-engine/src/rng.ts`; `simulate({teamA, teamB, seed})` is a pure function. Do not reintroduce `Math.random()` into the engine — determinism is what makes a second implementation checkable against this one, and mulberry32 was chosen because it ports to Rust `u32` wrapping arithmetic exactly.

The model itself is rating-based: team attack/defence averages by position group → chance count → conversion rate → weighted scorer selection (FW 1.0 × attackRating, MF 0.3, DF 0.05, GK 0), then commentary events are laid over the resulting goals.

### Frontend page flow
State moves between pages via React Router `location.state`, not a store or URL params:
`Home` (team select) → `navigate('/simulate', { state: { teamAId, teamBId } })` → `Simulate` runs the sim and shows step animation → `navigate('/broadcast', { state: { matchResult, teamA, teamB } })` → `Broadcast` animates events minute by minute → `Result`. Landing on `/simulate` or `/broadcast` directly has no state and redirects home.

Custom XIs are stored in `localStorage` (`utils/customXIStorage.ts`), and `CustomXIBuilder` passes fully-built `Team` objects into `api.simulateMatch()` as `customTeamA`/`customTeamB` to bypass the id lookup.

### Admin
`/admin` edits the dataset through `services/adminApi.ts` → `api/server.js` at `:3000/api/admin/*`, which reads and writes `web/public/teams-data-normalized.json` directly and exposes `/api/admin/validate` for referential-integrity checks. Run that validator after any bulk data change.

Editing data while the app is open will not refresh it — `services/api.ts` caches the parsed file for the page's lifetime. `invalidateTeamsCache()` is exported for that, currently unused.

## History worth knowing

The project used to have a C# Azure Functions backend (`api/MatchSimulator.Function/`) with SQLite and a Claude-driven "AI match engine". All of it was removed. Two things to know if you meet references to it:

- The Functions app served teams from a **different** dataset (`teams-players.json`, ids like `mu-1`) than the frontend's normalized file (ids like `alex-stepney`), with only 5 of 21 teams in common. `web/scripts/migrate-legacy-teams.mjs` merged them — matching players on *slugified* names, because the legacy set spelled names without diacritics. Its inputs are preserved in `web/scripts/legacy/`. Re-running it is idempotent.
- Source data quality is uneven and predates the migration: some squads contain invented or misattributed players (e.g. `Bojan Joksimovic` in the Hungary 1954 squad). Migration copied these faithfully rather than silently correcting them.

## Known dead code

`generateFoulEvent` in `packages/match-engine/src/engine.ts` is exported but never called, so no simulated match produces a booking and `PlayerStats.yellowCards`/`redCards` are always 0. It was carried over intact from the original engine. Wiring it into the event loop is a behaviour change, not a refactor — decide deliberately.

## Conventions

- Styling is Tailwind (`web/tailwind.config.ts`) with a retro-broadcast look; components are function components with named exports (`export const Foo: React.FC`), imported by name.
- Team ids are slugs like `man-utd-1968`, `liverpool-1984`; player ids are name slugs like `kenny-dalglish`.
- `web/src/types/index.ts` holds the app's types; the engine's live in `packages/match-engine/src/types.ts`. They are intentionally duplicated — do not make the engine import from the app.
