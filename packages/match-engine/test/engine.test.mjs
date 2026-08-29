import { test } from 'node:test';
import assert from 'node:assert/strict';
import { simulateMatch, Rng } from '../src/index.ts';

const player = (id, position, attack, defence, overall = 80) => ({
  id,
  name: `Player ${id}`,
  position,
  overallRating: overall,
  attackRating: attack,
  defenceRating: defence,
  stamina: 80,
});

/** An 11-player side at a uniform quality level. */
const team = (id, quality) => ({
  id,
  name: `Team ${id}`,
  players: [
    player(`${id}-1`, 'GK', 20, quality, quality),
    player(`${id}-2`, 'LB', quality - 15, quality, quality),
    player(`${id}-3`, 'CB', quality - 20, quality, quality),
    player(`${id}-4`, 'CB', quality - 20, quality, quality),
    player(`${id}-5`, 'RB', quality - 15, quality, quality),
    player(`${id}-6`, 'CM', quality, quality - 10, quality),
    player(`${id}-7`, 'CM', quality, quality - 10, quality),
    player(`${id}-8`, 'LM', quality, quality - 15, quality),
    player(`${id}-9`, 'RW', quality, quality - 25, quality),
    player(`${id}-10`, 'ST', quality, quality - 30, quality),
    player(`${id}-11`, 'ST', quality, quality - 30, quality),
  ],
});

const strong = team('strong', 92);
const weak = team('weak', 55);
const even = team('even', 75);

test('Rng is deterministic for a given seed', () => {
  const a = Array.from({ length: 20 }, () => new Rng(42).next());
  assert.equal(new Set(a).size, 1, 'a fresh Rng(42) always yields the same first value');

  const seq1 = (() => { const r = new Rng(7); return Array.from({ length: 50 }, () => r.next()); })();
  const seq2 = (() => { const r = new Rng(7); return Array.from({ length: 50 }, () => r.next()); })();
  assert.deepEqual(seq1, seq2);
  assert.ok(seq1.every((v) => v >= 0 && v < 1), 'values stay in [0, 1)');
});

test('same seed and teams produce an identical match', () => {
  const a = simulateMatch({ teamA: strong, teamB: weak, seed: 12345 });
  const b = simulateMatch({ teamA: strong, teamB: weak, seed: 12345 });
  assert.deepEqual(a, b);
});

test('different seeds produce different matches', () => {
  const results = new Set(
    Array.from({ length: 25 }, (_, i) =>
      JSON.stringify(simulateMatch({ teamA: even, teamB: even, seed: i })),
    ),
  );
  assert.ok(results.size > 1, 'seeds must actually vary the outcome');
});

test('team ratings drive the result', () => {
  let strongWins = 0;
  let weakWins = 0;
  for (let seed = 0; seed < 300; seed++) {
    const r = simulateMatch({ teamA: strong, teamB: weak, seed });
    if (r.scoreA > r.scoreB) strongWins++;
    else if (r.scoreB > r.scoreA) weakWins++;
  }
  assert.ok(
    strongWins > weakWins * 3,
    `a far better side should dominate, got ${strongWins} vs ${weakWins}`,
  );
});

test('results stay within plausible football bounds', () => {
  for (let seed = 0; seed < 300; seed++) {
    const r = simulateMatch({ teamA: even, teamB: even, seed });
    assert.ok(r.scoreA >= 0 && r.scoreA <= 9, `scoreA out of range: ${r.scoreA}`);
    assert.ok(r.scoreB >= 0 && r.scoreB <= 9, `scoreB out of range: ${r.scoreB}`);
    assert.equal(r.goalsA.length, r.scoreA);
    assert.equal(r.goalsB.length, r.scoreB);
    assert.equal(r.stats.possessionA + r.stats.possessionB, 100);
    assert.ok(r.manOfTheMatch && r.manOfTheMatch !== 'Unknown');
  }
});

test('every goal is attributed to the side that scored it', () => {
  for (let seed = 0; seed < 200; seed++) {
    const r = simulateMatch({ teamA: strong, teamB: weak, seed });
    for (const g of r.goalsA) assert.equal(g.teamId, strong.id);
    for (const g of r.goalsB) assert.equal(g.teamId, weak.id);
    const names = new Set(strong.players.map((p) => p.name));
    for (const g of r.goalsA) assert.ok(names.has(g.playerName), `${g.playerName} is not in team A`);
  }
});

test('events are chronological and carry a consistent running score', () => {
  const r = simulateMatch({ teamA: strong, teamB: even, seed: 99 });
  let last = -1;
  for (const e of r.events) {
    assert.ok(e.minute >= last, 'events must be ordered by minute');
    last = e.minute;
  }
  const final = r.events[r.events.length - 1];
  assert.equal(final.scoreA, r.scoreA);
  assert.equal(final.scoreB, r.scoreB);
});
