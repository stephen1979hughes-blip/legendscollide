/**
 * Balance calibration.
 *
 * engine.test.mjs proves the engine is deterministic and internally consistent.
 * This file proves it is *decisive* — that the rating gaps which actually occur
 * in the dataset change who wins.
 *
 * That distinction matters because the two suites can pass and fail
 * independently. The original engine passed every determinism test while the
 * best squad in the dataset beat the worst only 39% of the time: `attack -
 * defence` moved the chance count by ±0.43 against a ±2.0 noise band, so the
 * simulation was a coin flip wearing a scoreline. engine.test.mjs missed it
 * because its `strong` and `weak` sides are 37 rating points apart — a gap no
 * real pair of squads comes close to.
 *
 * So the anchors below are measured from web/public/teams-data-normalized.json
 * rather than invented. The engine package deliberately does not depend on the
 * web app's data, so they are transcribed as constants; if the dataset's spread
 * is ever widened, re-measure them and expect these thresholds to move.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { simulateMatch } from '../src/index.ts';

/**
 * A squad whose computed attack and defence averages are exactly (attack,
 * defence). The engine averages attackRating over FW+MF and defenceRating over
 * DF+MF, so a 4-3-3 with those two figures held flat across the relevant groups
 * lets a test name a differential directly.
 */
const squad = (id, attack, defence) => {
  const player = (n, position, attackRating, defenceRating) => ({
    id: `${id}-${n}`,
    name: `${id} ${n}`,
    position,
    overallRating: Math.round((attack + defence) / 2),
    attackRating,
    defenceRating,
    stamina: 80,
  });
  return {
    id,
    name: id,
    players: [
      player(1, 'GK', 20, 50),
      player(2, 'LB', 60, defence),
      player(3, 'CB', 45, defence),
      player(4, 'CB', 45, defence),
      player(5, 'RB', 60, defence),
      player(6, 'CM', attack, defence),
      player(7, 'CM', attack, defence),
      player(8, 'CAM', attack, defence),
      player(9, 'LW', attack, 45),
      player(10, 'ST', attack, 40),
      player(11, 'RW', attack, 45),
    ],
  };
};

// Squad profiles measured from the 26 classic teams, rounded to 0.1.
const STRONGEST = squad('strongest', 85.7, 86.8); // Manchester United 2008
const WEAKEST = squad('weakest', 78.3, 77.9); // Red Star Belgrade 1991
const UPPER_MID = squad('upper-mid', 84.7, 84.9); // Germany 2014
const MID = squad('mid', 80.1, 80.1); // Liverpool 1984
const EVEN_A = squad('even-a', 83, 83);
const EVEN_B = squad('even-b', 83, 83);

// Card-progression profiles (Phase 2, see web/src/utils/cardProgression.ts).
// Every classic-team assertion above is untouched by any of this — none of
// those profiles carry a differential anywhere near what card levels create,
// which is exactly what the "unaffected" assertions below check for.
//
// FRESH: a squad of level-1 cards. Every stat collapses to CARD_RATING_FLOOR
// (see cardProgression.ts) regardless of the underlying player, so a fresh
// squad's own attack/defence numbers don't depend on *who* is in it.
const FRESH = squad('fresh', 75, 75);

// MAXED: the strongest XI actually constructible from the full 414-player
// pool once every stat is fully levelled — GK by overall, back four by
// defenceRating, front three by attackRating, and the three midfield slots
// by whichever of their two ratings is lower (so a one-footed attacking
// midfielder doesn't crowd out a genuine two-way one). That last rule is the
// deliberate choice: picking pure overall for midfield, like the dataset's
// "best XI" headline figure does, drags in players who are brilliant going
// forward and merely average defensively (Maradona, Zidane, Xavi), which
// gives the squad a bigger attack number than defence number and — because
// the engine feeds a side's *own* attack/defence gap into its own scoring
// rate, not just the matchup differential — makes it leak goals in a mirror
// match regardless of the opponent. Optimising for a floor under both stats
// avoids that: attack 90.0, defence 87.7 (both measured from
// web/public/teams-data-normalized.json, 4 September 2026).
const MAXED = squad('maxed', 90.0, 87.7);

// STRONGEST_OVERALL: Barcelona 2011, the highest *overall*-rated classic team
// (88.0) rather than STRONGEST above (Manchester United 2008), which is
// strongest by the engine's own attack+defence pooling but not by the figure
// the roadmap and the rest of the game quote as "team strength". This is the
// benchmark the progression headroom is measured against — see
// ROADMAP.md's "Progression headroom" row.
const STRONGEST_OVERALL = squad('strongest-overall', 84.2, 82.4);

const SIMS = 3000;

/** Win/draw/loss percentages and goal averages for teamA over SIMS seeds. */
function record(teamA, teamB, sims = SIMS) {
  let wins = 0;
  let draws = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;
  let possession = 0;
  let highestScore = 0;
  let goallessDraws = 0;
  for (let seed = 0; seed < sims; seed++) {
    const r = simulateMatch({ teamA, teamB, seed });
    if (r.scoreA > r.scoreB) wins++;
    else if (r.scoreA === r.scoreB) draws++;
    goalsFor += r.scoreA;
    goalsAgainst += r.scoreB;
    possession += r.stats.possessionA;
    highestScore = Math.max(highestScore, r.scoreA, r.scoreB);
    if (r.scoreA === 0 && r.scoreB === 0) goallessDraws++;
  }
  return {
    win: (100 * wins) / sims,
    draw: (100 * draws) / sims,
    loss: (100 * (sims - wins - draws)) / sims,
    goalsFor: goalsFor / sims,
    goalsAgainst: goalsAgainst / sims,
    totalGoals: (goalsFor + goalsAgainst) / sims,
    possession: possession / sims,
    highestScore,
    goallessRate: (100 * goallessDraws) / sims,
  };
}

test('evenly matched sides are a genuine coin flip', () => {
  const r = record(EVEN_A, EVEN_B);
  assert.ok(
    Math.abs(r.win - r.loss) < 3,
    `no side should be favoured, got ${r.win.toFixed(1)}% vs ${r.loss.toFixed(1)}%`,
  );
  assert.ok(
    r.draw > 20 && r.draw < 35,
    `draw rate should be football-like, got ${r.draw.toFixed(1)}%`,
  );
  assert.equal(Math.round(r.possession), 50, 'equal sides should share possession');
});

test('the widest gap in the dataset produces a clear favourite', () => {
  const r = record(STRONGEST, WEAKEST);
  assert.ok(
    r.win >= 62 && r.win <= 80,
    `the best squad vs the worst should win clearly but not always, got ${r.win.toFixed(1)}%`,
  );
  assert.ok(r.loss < 18, `an upset should stay rare, got ${r.loss.toFixed(1)}%`);
  assert.ok(
    r.possession >= 57,
    `a dominant side should hold the ball, got ${r.possession.toFixed(1)}%`,
  );
});

test('win rate rises monotonically with the rating edge', () => {
  const ladder = [
    ['vs strongest', record(MID, STRONGEST, 1500).win],
    ['vs upper-mid', record(MID, UPPER_MID, 1500).win],
    ['vs mid', record(MID, MID, 1500).win],
    ['vs weakest', record(MID, WEAKEST, 1500).win],
  ];
  for (let i = 1; i < ladder.length; i++) {
    assert.ok(
      ladder[i][1] > ladder[i - 1][1] + 3,
      `each easier opponent should measurably raise the win rate: ` +
        ladder.map(([label, w]) => `${label} ${w.toFixed(1)}%`).join(', '),
    );
  }
});

test('a small rating edge is felt without deciding the match', () => {
  // Germany 2014 over Liverpool 1984 — a real but not overwhelming gap.
  const r = record(UPPER_MID, MID);
  assert.ok(
    r.win > 45 && r.win < 65,
    `a moderate favourite should be favoured, not certain, got ${r.win.toFixed(1)}%`,
  );
  assert.ok(r.loss > 12, `the underdog must keep a real chance, got ${r.loss.toFixed(1)}%`);
});

test('scoring stays within football-like bounds across the ladder', () => {
  for (const [label, a, b] of [
    ['even', EVEN_A, EVEN_B],
    ['mismatch', STRONGEST, WEAKEST],
    ['moderate', UPPER_MID, MID],
  ]) {
    const r = record(a, b, 1500);
    assert.ok(
      r.totalGoals > 2.2 && r.totalGoals < 3.4,
      `${label}: ${r.totalGoals.toFixed(2)} goals/match is outside the plausible range`,
    );
    assert.ok(r.highestScore <= 9, `${label}: a side scored ${r.highestScore}`);
    assert.ok(
      r.goallessRate > 1 && r.goallessRate < 15,
      `${label}: 0-0 draws at ${r.goallessRate.toFixed(1)}% is unrealistic`,
    );
  }
});

test('shot counts track the balance of play', () => {
  const lopsided = simulateMatch({ teamA: STRONGEST, teamB: WEAKEST, seed: 1 });
  const even = simulateMatch({ teamA: EVEN_A, teamB: EVEN_B, seed: 1 });
  assert.ok(
    lopsided.stats.shotsA > lopsided.stats.shotsB,
    'the stronger side should out-shoot the weaker one',
  );
  assert.ok(
    Math.abs(even.stats.shotsA - even.stats.shotsB) <= 4,
    'evenly matched sides should trade chances',
  );
  for (const r of [lopsided, even]) {
    assert.ok(
      r.stats.shotsOnTargetA <= r.stats.shotsA && r.stats.shotsOnTargetB <= r.stats.shotsB,
      'shots on target cannot exceed shots',
    );
  }
});

/**
 * Wide-band assertions (Phase 2, card progression).
 *
 * Every test above pins the classic band — no classic-vs-classic differential
 * ever exceeds ±8.5 — and none of them change: RATING_SCALE(16) still governs
 * that whole range untouched. These tests pin the *new* range card levels
 * introduce, which a fresh or fully-levelled squad can push well past ±8.5.
 * RESPONSE_KNEE and RATING_SCALE_WIDE in engine.ts are what's actually being
 * checked here.
 */

test('a level-1 squad keeps a fighting chance against a mid-table classic side', () => {
  const r = record(FRESH, MID);
  assert.ok(
    r.win > 12 && r.win < 30,
    `a fresh squad should lose more often than not but stay a live underdog, got ${r.win.toFixed(1)}%`,
  );
  assert.ok(
    r.loss > 50,
    `the classic side should be the clear favourite, got ${r.loss.toFixed(1)}% for the fresh squad`,
  );
});

test('a fully levelled squad is a real threat to the strongest classic team', () => {
  const r = record(MAXED, STRONGEST_OVERALL);
  assert.ok(
    r.win > 55 && r.win < 75,
    `the levelled squad should be favoured but not overwhelming, got ${r.win.toFixed(1)}%`,
  );
  assert.ok(r.loss > 10, `the reigning strongest side must keep a real chance, got ${r.loss.toFixed(1)}%`);
});

test('two squads at the same level are a coin flip, however strong', () => {
  for (const [label, a, b] of [
    ['fresh v fresh', FRESH, FRESH],
    ['maxed v maxed', MAXED, MAXED],
  ]) {
    const r = record(a, b);
    assert.ok(
      Math.abs(r.win - r.loss) < 3,
      `${label}: no side should be favoured, got ${r.win.toFixed(1)}% vs ${r.loss.toFixed(1)}%`,
    );
    assert.ok(Math.round(r.possession) === 50, `${label}: equal sides should share possession`);
  }
});

test('scoring stays plausible across the widened level band', () => {
  for (const [label, a, b] of [
    ['fresh v mid classic', FRESH, MID],
    ['fresh v strongest classic', FRESH, STRONGEST],
    ['maxed v weakest classic', MAXED, WEAKEST],
    ['maxed v maxed', MAXED, MAXED],
  ]) {
    const r = record(a, b, 1500);
    assert.ok(
      r.totalGoals > 2.2 && r.totalGoals < 3.4,
      `${label}: ${r.totalGoals.toFixed(2)} goals/match is outside the plausible range`,
    );
    assert.ok(r.highestScore <= 9, `${label}: a side scored ${r.highestScore}`);
  }
});
