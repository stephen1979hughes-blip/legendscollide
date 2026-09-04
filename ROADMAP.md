# Legends Collide — Roadmap

Six ideas, one at a time.

A deterministic football engine, 26 classic squads and 414 players already exist and
work. This document sequences everything else — daily fixture, card collection,
accounts, subscription, real fixtures, PvP — by what each phase costs and what it
proves. **The order is the whole point.**

A formatted version of this document is published at
<https://claude.ai/code/artifact/966fb9d9-605d-4134-a77e-fcfcd7b4aae5>.

Figures measured 4 September 2026.

---

## Standing position

The engine rebalance is done and pinned by a calibration suite. These are the
measured figures every decision below rests on.

| Measure | Figure | Notes |
| --- | --- | --- |
| Decisiveness | 39% → 71% | Win rate for the widest rating gap in the dataset, before and after the rebalance |
| Goals per match | 2.75 | Down from 3.21. Real football sits near 2.7 |
| Squad pool | 414 players | Across 26 classic teams; 137 carry written bios |
| Progression headroom | 7.0 pts | Random pack XI 85.3 vs best possible XI 92.3. Too flat — Phase 2 fixes this |
| Marginal simulation cost | £0.00 | Runs client-side, replays from a seed. The structural advantage |
| Backend today | None | Static bundle. Phases 0–2 keep it that way |

---

## The sequence

### Phase 0 — Ship what exists · **start here**

`2–4 days` · `no backend`

**Proves:** does anyone share a result once they can?

- Deploy the static bundle to Cloudflare Pages or Netlify — free tier, no server.
- **Match permalinks:** `/m/brazil-1970-v-germany-2014/48213`. The seed is the entire
  match state, so a link replays identically. This is the one piece everything
  downstream needs.
- Open Graph scoreline cards, a real `<title>`, a favicon that isn't `vite.svg`.
- Privacy-friendly analytics, so later phases have a baseline to beat.
- Fix the dead About / Contact / Privacy links in the footer.

> **Known trap:** the seed is currently thrown away. `api.simulateMatch()` accepts one
> and defaults to `randomSeed()`, but never returns it, and the engine's `MatchResult`
> has no seed field. Fix that first.

> **Known trap:** crawlers don't run JavaScript. Setting `og:` tags from React works in
> a browser and does nothing when a link is actually shared.

### Phase 1 — The daily fixture

`1–2 weeks` · `no backend`

**Proves:** do they come back tomorrow?

- One fixture a day, **seed derived from the UTC date** — everyone gets the identical
  match, which is exactly what the engine's determinism already guarantees.
- Predict the score and the scorer before it plays.
- A spoiler-free share grid, and a streak in `localStorage`.
- 325 unique pairings ≈ 11 months before a fixture repeats.

This is the **acquisition** test and it is cheap. Collection keeps people; something
has to bring them first.

### Phase 2 — Collection and progression

`4–6 weeks` · `no backend`

**Proves:** do they play more than once a day?

- **Card levels.** Every card enters at a fraction of its true rating and levels up by
  playing — a level-1 Pelé plays at ~72, a maxed one at 94. This is the mechanic that
  fixes the 7.0-point curve, creates the missing bronze tier without inventing weak
  players, and makes duplicates useful as level-up fuel.
- Tokens earned from wins; packs cost tokens. Nothing purchasable.
- The 26 classic teams become a **campaign ladder** — graded 83.5 to 88.0, content
  already owned. Beat Milan 1994, get a shot at Baresi and Maldini.
- Chemistry from nationality: 42 countries in the data, 10 with enough players for a
  full national XI. This is what stops "field the 11 best".
- Retune `RATING_SCALE` for the wider band — against the calibration suite, not by feel.

---

> ### ↓ Cost starts here
>
> Everything above runs on a static host for nothing. Everything below needs
> infrastructure, maintenance, or both. **Do not cross this line until Phases 1–2 show
> people returning.**

---

### Phase 3 — Accounts

`2–3 weeks` · `first infra cost`

**Proves:** nothing new — it is the enabler for everything after it.

- Auth, cloud save, cross-device sync. Collections in `localStorage` die with a cleared
  browser, and that becomes unacceptable once people have invested months.
- Server-side simulation as the authority. The engine package has no React or app
  dependency, so **it already runs headless unchanged** — the separation built for a
  Rust/WASM swap pays off here instead.

### Phase 4 — Subscription

`1–2 weeks` · `payments, tax, refunds`

**Proves:** will anyone actually pay?

- Headline value is **non-random**: ad-free, sync, advanced stats, saved-history limits,
  cosmetics. A monthly pack allowance rides along as a bonus.
- Publish drop odds. Both app stores require it, and it keeps the framing clean.
- Benchmark: the nearest comparable charges `$4.49`/month and sells mostly server time —
  the one thing we can't sell, because ours is free to run.

### Phase 5 — Real fixtures

`ongoing commitment` · `recurring data cost`

**Proves:** can we acquire at scale, against an incumbent?

- A nightly build-time job fetches fixtures and squads and commits static JSON — **this
  keeps us on a static host** rather than forcing a live backend.
- A page per real fixture: simulated odds, prediction poll, comments. That page network,
  not the simulator, is what earns the traffic.
- **The hard part is ratings, not fixtures.** Fixture and squad APIs are cheap and
  plentiful; quality ratings are neither, which is why the incumbent leans on a
  third-party ratings source.

Deliberately late. It is the most expensive, the most maintenance-heavy, and the only
phase that puts us head-to-head with someone three years ahead. Build it when there is
something distinctive for the traffic to land on.

### Phase 6 — Asynchronous PvP

`3–4 weeks` · `anti-cheat surface`

**Proves:** whether the collection is worth showing off.

- No netcode needed. Squad A + squad B + a shared seed, and both clients compute the
  identical match.
- The server validates that you own the cards you fielded, then replays the seed to
  confirm the result. **Verifiability falls out of determinism for free** — most games
  pay dearly for it.
- Needs a player base to not feel empty, which is why it is last rather than first.

---

## Decisions already made

1. **No direct purchase of packs or players.** The subscription grants an allowance;
   tokens are earned. This keeps us clear of selling access to real people's names,
   which is where trading cards become a licensed business.

2. **Legends is free to play — progression is what's paid.** *(Adjusted.)* The original
   proposal put the whole Legends mode behind the fee. Inverted here: gating the only
   differentiator hides it, and a free tier that just clones real-match simulation
   competes on the incumbent's strongest ground with none of our own. Let Legends be the
   shop window.

3. **Real squads arrive by build-time ingestion, not a live backend.** A scheduled job
   commits static JSON. Preserves the zero-marginal-cost architecture that is the single
   biggest advantage over the incumbent, whose stated top priority for 2026 is server
   stability.

4. **Names only — no photos, badges, crests or kits.** Plus a visible non-affiliation
   notice, third-party data attribution, and a standing decision to honour any takedown
   request promptly and without argument.

---

## The comparable, in numbers

From matchsimulator.com's own public stats page — the scale being aimed at.

| Measure | Figure | What it tells you |
| --- | --- | --- |
| Registered users | 184.2K | Growing ~169/day. Roughly doubled in eight months |
| Simulated matches | 241.4M | +264K daily. Load we could serve from a CDN for pennies |
| Subscription | $4.49/mo | Sells speed, storage, stats, ad-free. Never sells players |
| Ad network | AdThrive | Has a ~100K monthly pageview floor to even join |
| Play Store installs | 35K+ | A thin wrapper around the same web app |
| Stated 2026 priority | Server stability | Doubling capacity wasn't enough. Their weakness, our advantage |

---

## Explicitly not now

- **Era chemistry.** Thematically the best fit for a legends game, but 175 players — 42%
  of the pool — appear in no classic team, so era isn't derivable. It's a data migration
  before it's a feature.
- **Ratings curation.** The engine now faithfully amplifies whatever the data says, which
  means it amplifies rating errors too. Worth doing, but polish, not a blocker.
- **Tactics and formations.** A genuine strategy layer, but chemistry already gives
  Phase 2 its puzzle. Adding both at once makes neither testable.
- **Bookings and cards.** `generateFoulEvent` exists and is never called. A one-session
  fix that adds credibility — do it whenever, just not instead of a phase.

---

## What could go wrong

| Risk | Phase | Mitigation |
| --- | --- | --- |
| Acquisition, not retention, is the real bottleneck | 1 | Packs make people stay; they don't make people arrive. The daily fixture is the cheap test of whether anything travels |
| Paid randomised content reads as loot boxes | 4 | Earn-only tokens, published drop odds, non-random headline value in the subscription |
| No licence for real player ratings | 5 | The genuinely unsolved one. Derive ratings from public match statistics, or accept the same third-party dependency the incumbent carries |
| Publicity rights and trademarks | All | Names only, clear non-affiliation notice, no monetisation of likeness itself. Estates of deceased legends sit outside collective licensing |
| Building six things at once | — | The reason this document exists. One phase, shipped, measured, before the next |
