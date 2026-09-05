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

// ============= Token yield =============
//
// See the Phase 2b PR description for the full arithmetic. In short:
// average win ≈ 20 + 20 + 13.5(avg tier) * 2 ≈ 67 tokens, average loss = 20,
// so at a rough 60% win rate a campaign run earns ~48 tokens/match. Over the
// ~50-80-match horizon cardProgression.ts documents for maxing an XI, that's
// roughly one pack every 5 matches — enough to build and rotate a real
// roster without the pack economy outrunning the level climb.

/** Tokens for simply playing a campaign match, win or lose. */
export const TOKENS_PER_MATCH = 20;
/** Flat bonus for winning. */
export const TOKENS_WIN_BONUS = 20;
/** Extra tokens per ladder tier (1-26) of the opponent beaten — harder fixtures pay more. */
export const TOKENS_PER_LADDER_TIER = 2;

export function tokensForMatch(tier: number, won: boolean): number {
  if (!won) return TOKENS_PER_MATCH;
  return TOKENS_PER_MATCH + TOKENS_WIN_BONUS + tier * TOKENS_PER_LADDER_TIER;
}
