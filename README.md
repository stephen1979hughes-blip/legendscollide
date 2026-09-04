# Football Match Simulator

Pick two legendary teams, simulate the match, watch it unfold as a live broadcast.

Where this goes next, and in what order: [ROADMAP.md](ROADMAP.md).

## Tech Stack

- **Frontend:** React + TypeScript + Vite + Tailwind
- **Match engine:** `@fm/match-engine` — a standalone, deterministic TypeScript package
- **Data:** a single normalized JSON file, `web/public/teams-data-normalized.json`
- **Admin server:** a small Express app, local development only

There is no deployed backend. The app is a static site: it loads the data file
and simulates matches in the browser.

## Quick Start

```bash
cd web && npm install && npm run dev
```

That is the whole app, on `http://localhost:5173`.

To edit the dataset through the `/admin` UI, also run the local admin server —
it is the only thing that writes to the data file:

```bash
cd api && npm install && npm run dev
```

## Layout

```
fm/
├── packages/match-engine/     # the simulation, isolated from the app
│   ├── src/engine.ts          # rating-based match model
│   ├── src/rng.ts             # seeded PRNG (mulberry32)
│   ├── src/types.ts           # the engine's own contract
│   └── test/                  # determinism + behaviour tests
├── web/                       # React app
│   ├── public/teams-data-normalized.json   # single source of truth
│   ├── src/services/api.ts    # data access + engine invocation
│   ├── src/utils/dataProcessor.ts          # normalized JSON -> app types
│   └── scripts/               # data migration + normalization scripts
└── api/server.js              # local-only admin CRUD server
```

## The match engine

The engine is a separate package so it can be replaced by a Rust/WASM build
without touching the app. The web app depends on it only through the
`MatchEngine` interface:

```ts
interface MatchEngine {
  readonly name: string;
  simulate(input: { teamA: EngineTeam; teamB: EngineTeam; seed: number }): MatchResult;
}
```

Matches are **deterministic**: the same teams and seed always produce the same
result. That is what allows a second implementation to be diffed against this
one for parity.

```bash
cd packages/match-engine && npm test
```

Vite resolves `@fm/match-engine` through an alias in `web/vite.config.ts`.
Repoint that alias to swap engines.

## Data

`web/public/teams-data-normalized.json` holds `countries`, `clubs`,
`nationalTeams`, `players` and `classicTeams` — 26 classic teams and 416
players. Teams reference players by id; players carry ratings and bios.

Scripts in `web/scripts/`:

- `migrate-legacy-teams.mjs` — one-off merge of the retired .NET dataset into
  the normalized file (already applied; inputs kept in `scripts/legacy/`)
- `normalize-teams-data.mjs` — regenerates the normalized file from the older
  `teams-data.json` shape

## Deployment

```bash
cd web && npm run build     # -> web/dist, a static bundle
```

Serve `web/dist` from any static host. The admin server is not deployed.
