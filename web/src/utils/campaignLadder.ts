/**
 * The campaign ladder (Phase 2b): the 26 classic teams, ordered by squad
 * strength from weakest to strongest. Computed from the live team data
 * rather than hardcoded, so an admin edit to the dataset re-orders the
 * ladder automatically instead of silently drifting out of sync with it.
 *
 * Ordered (and rated) by the same attack/defence average the match engine
 * actually decides fixtures with — `calcTeamAttack`/`calcTeamDefence` in
 * packages/match-engine/src/engine.ts, duplicated here the same way
 * position.ts duplicates `getPositionCategory` (CLAUDE.md sanctions this:
 * the engine and app are deliberately separate, small overlap and all).
 * A plain mean of `overallRating` was tried first and is wrong: it averages
 * every player equally, while the engine only ever looks at attackRating
 * for forwards+midfielders and defenceRating for defenders+midfielders. On
 * the shipped dataset that scrambles the ordering — e.g. Liverpool 1984
 * ranks a comfortable 12th of 26 by mean overall (85.6) but is actually the
 * *3rd-weakest* team by the engine's own math (attack 80.1 / defence 80.1)
 * — and compresses the true spread tier 1 needs to be a real "beat this
 * with a level-1 squad" test: Red Star Belgrade 1991 reads as 83.5 by mean
 * overall but is 78.1 by attack/defence, barely above the level-1 floor of
 * 75. That gap is what let a level-1 squad win far more often than the
 * ladder position implied — not the engine reading a card's potential
 * instead of its level, but the ladder mis-ranking (and understating the
 * difficulty of) the opponents a fresh squad was actually facing.
 */
import { Team } from '../types';
import { CampaignTier } from '../types/campaign';
import { coarsePosition } from './position';

function teamAttack(team: Team): number {
  const fwd = team.players.filter((p) => coarsePosition(p.position) === 'FW');
  const mid = team.players.filter((p) => coarsePosition(p.position) === 'MF');
  const pool = fwd.length > 0 ? [...fwd, ...mid] : mid;
  if (pool.length === 0) return 70;
  return pool.reduce((sum, p) => sum + p.attackRating, 0) / pool.length;
}

function teamDefence(team: Team): number {
  const def = team.players.filter((p) => coarsePosition(p.position) === 'DF');
  const mid = team.players.filter((p) => coarsePosition(p.position) === 'MF');
  const pool = def.length > 0 ? [...def, ...mid] : mid;
  if (pool.length === 0) return 70;
  return pool.reduce((sum, p) => sum + p.defenceRating, 0) / pool.length;
}

/** The engine-consistent difficulty figure: the average of a squad's own attack and defence ratings. */
function engineStrength(team: Team): number {
  if (team.players.length === 0) return 0;
  return (teamAttack(team) + teamDefence(team)) / 2;
}

export function buildLadder(teams: Team[]): CampaignTier[] {
  return [...teams]
    .sort((a, b) => engineStrength(a) - engineStrength(b))
    .map((team, index) => ({
      tier: index + 1,
      teamId: team.id,
      teamName: team.name,
      year: team.year,
      rating: Math.round(engineStrength(team) * 10) / 10,
    }));
}

// ============= Match XP =============
//
// Phase 2c unifies what used to be two separate rewards (tokens for packs,
// automatic per-card XP for playing) into one wallet (see xpWallet.ts) that
// the player then chooses how to spend. "Doing well gives a lot": a win pays
// roughly 2-3x a loss rather than a flat participation amount, so the reward
// actually tracks how the match went, not just that a match happened.
//
// A win still pays more against a harder (higher-tier) opponent on top of
// that, same as the old token formula: average win ≈ 70 + 13.5(avg tier)*2 ≈
// 97 XP, draw 35, loss 20.

export type MatchOutcome = 'win' | 'draw' | 'loss';

/** XP for a loss — still worth playing for, just clearly the worst outcome. */
export const XP_LOSS = 20;
/** XP for a draw. */
export const XP_DRAW = 35;
/** Base XP for a win, before the ladder-tier bonus. */
export const XP_WIN_BASE = 70;
/** Extra XP per ladder tier (1-26) of the opponent beaten — win only, harder fixtures pay more. */
export const XP_PER_LADDER_TIER = 2;

export function xpForMatch(tier: number, outcome: MatchOutcome): number {
  if (outcome === 'loss') return XP_LOSS;
  if (outcome === 'draw') return XP_DRAW;
  return XP_WIN_BASE + tier * XP_PER_LADDER_TIER;
}
