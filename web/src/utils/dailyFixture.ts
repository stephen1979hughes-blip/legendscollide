import { Rng } from '@fm/match-engine';
import { api } from '../services/api';
import type { DailyFixture } from '../types/daily';

/**
 * Day 0 of the fixture list. Fixed forever once chosen — changing it would
 * shift every fixture that's ever been played. Set ahead of the actual
 * ship date since the site isn't deployed yet.
 */
const EPOCH_UTC_MS = Date.UTC(2025, 0, 1);

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Seeds the one-time shuffle of all team pairings. Fixed forever for the same
 * reason as the epoch: reshuffling would silently change every fixture, past
 * and future. Not derived from anything — just a constant.
 */
const PERMUTATION_SEED = 1970;

function utcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function dayNumberForDate(date: Date): number {
  const todayUtcMs = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.floor((todayUtcMs - EPOCH_UTC_MS) / ONE_DAY_MS);
}

/** Every unique pairing of team indices, shuffled once with a fixed seed. */
function buildPairPermutation(teamCount: number): Array<[number, number]> {
  const pairs: Array<[number, number]> = [];
  for (let i = 0; i < teamCount; i++) {
    for (let j = i + 1; j < teamCount; j++) {
      pairs.push([i, j]);
    }
  }
  return new Rng(PERMUTATION_SEED).shuffle(pairs);
}

let teamIdsPromise: Promise<string[]> | null = null;

/**
 * Team ids in a fixed, data-only order (sorted by id, not by anything that
 * could change independently of the roster). Building fixtures depends on
 * this order staying stable for a given dataset.
 */
function sortedTeamIds(): Promise<string[]> {
  teamIdsPromise ??= api
    .getTeams()
    .then((teams) => teams.map((t) => t.id).sort((a, b) => a.localeCompare(b)));
  return teamIdsPromise;
}

/**
 * Derives the fixture for a given UTC day: which two teams play, which side
 * is "A", and the match seed. Pure function of the calendar date (and the
 * current roster) — two browsers on the same UTC day compute the same
 * fixture with no server involved.
 *
 * - Which pairing: `dayNumber mod 325` indexes into a fixed shuffle of all
 *   26-choose-2 pairings, so every pairing appears exactly once every full
 *   cycle (~11 months) instead of repeating early the way a fresh random
 *   pick each day would.
 * - Side (A/B) and the match seed: both derived from a Rng seeded on
 *   `dayNumber` itself. Reuses the engine's own seeded generator rather than
 *   inventing a second hashing scheme.
 */
export async function getDailyFixture(now: Date = new Date()): Promise<DailyFixture> {
  const teamIds = await sortedTeamIds();
  const permutation = buildPairPermutation(teamIds.length);
  const dayNumber = dayNumberForDate(now);

  const pairIndex = ((dayNumber % permutation.length) + permutation.length) % permutation.length;
  const [i, j] = permutation[pairIndex];

  const meta = new Rng(dayNumber >>> 0);
  const swap = meta.int(2) === 1;
  const seed = Math.floor(meta.next() * 0x100000000) >>> 0;

  return {
    dayNumber,
    dateKey: utcDateKey(now),
    teamAId: swap ? teamIds[j] : teamIds[i],
    teamBId: swap ? teamIds[i] : teamIds[j],
    seed,
  };
}
