import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  effectiveRating,
  applyXp,
  xpToNextLevel,
  MAX_CARD_LEVEL,
  CARD_RATING_FLOOR,
} from '../src/utils/cardProgression.ts';

test('effectiveRating: level 1 collapses to the common floor regardless of true rating', () => {
  assert.equal(effectiveRating(94, 1), CARD_RATING_FLOOR);
  assert.equal(effectiveRating(74, 1), CARD_RATING_FLOOR);
});

test('effectiveRating: max level returns the true rating exactly', () => {
  assert.equal(effectiveRating(94, MAX_CARD_LEVEL), 94);
  assert.equal(effectiveRating(74.3, MAX_CARD_LEVEL), 74.3);
});

test('effectiveRating: strictly increases with level for a card above the floor', () => {
  let prev = effectiveRating(90, 1);
  for (let level = 2; level <= MAX_CARD_LEVEL; level++) {
    const rating = effectiveRating(90, level);
    assert.ok(rating > prev, `level ${level} (${rating}) should exceed level ${level - 1} (${prev})`);
    prev = rating;
  }
});

test('effectiveRating: a card whose true rating equals the floor never moves', () => {
  for (let level = 1; level <= MAX_CARD_LEVEL; level++) {
    assert.equal(effectiveRating(CARD_RATING_FLOOR, level), CARD_RATING_FLOOR);
  }
});

test('effectiveRating: level is clamped to [1, MAX_CARD_LEVEL]', () => {
  assert.equal(effectiveRating(90, 0), effectiveRating(90, 1));
  assert.equal(effectiveRating(90, -5), effectiveRating(90, 1));
  assert.equal(effectiveRating(90, MAX_CARD_LEVEL + 5), effectiveRating(90, MAX_CARD_LEVEL));
});

test('xpToNextLevel: grows with level and is zero once maxed', () => {
  let prev = xpToNextLevel(1);
  assert.ok(prev > 0);
  for (let level = 2; level < MAX_CARD_LEVEL; level++) {
    const need = xpToNextLevel(level);
    assert.ok(need > prev, `level ${level}'s XP cost should exceed the previous level's`);
    prev = need;
  }
  assert.equal(xpToNextLevel(MAX_CARD_LEVEL), 0);
});

test('applyXp: cascades through multiple level-ups when XP covers them', () => {
  const need1 = xpToNextLevel(1);
  const need2 = xpToNextLevel(2);
  const result = applyXp({ level: 1, xp: 0 }, need1 + need2 + 10);
  assert.equal(result.level, 3);
  assert.equal(result.xp, 10);
});

test('applyXp: leaves a card short of the threshold at the same level with xp banked', () => {
  const need = xpToNextLevel(1);
  const result = applyXp({ level: 1, xp: 0 }, need - 1);
  assert.equal(result.level, 1);
  assert.equal(result.xp, need - 1);
});

test('applyXp: a maxed card absorbs no further XP', () => {
  const result = applyXp({ level: MAX_CARD_LEVEL, xp: 0 }, 999999);
  assert.deepEqual(result, { level: MAX_CARD_LEVEL, xp: 0 });
});

test('applyXp: enough XP to overshoot past max level clamps at max with no leftover xp', () => {
  const result = applyXp({ level: MAX_CARD_LEVEL - 1, xp: 0 }, 999999);
  assert.deepEqual(result, { level: MAX_CARD_LEVEL, xp: 0 });
});
