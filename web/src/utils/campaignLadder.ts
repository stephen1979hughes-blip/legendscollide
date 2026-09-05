/**
 * The campaign ladder (Phase 2b): the 26 classic teams, ordered by mean
 * squad rating from weakest (~83.5) to strongest (~88.0) — the same spread
 * ROADMAP.md's Phase 2 section describes. Computed from the live team data
 * rather than hardcoded, so an admin edit to the dataset re-orders the
 * ladder automatically instead of silently drifting out of sync with it.
 */
import { Team } from '../types';
import { CampaignTier } from '../types/campaign';

function meanOverall(team: Team): number {
  if (team.players.length === 0) return 0;
  return team.players.reduce((sum, p) => sum + p.overallRating, 0) / team.players.length;
}

export function buildLadder(teams: Team[]): CampaignTier[] {
  return [...teams]
    .sort((a, b) => meanOverall(a) - meanOverall(b))
    .map((team, index) => ({
      tier: index + 1,
      teamId: team.id,
      teamName: team.name,
      year: team.year,
      rating: Math.round(meanOverall(team) * 10) / 10,
    }));
}

// ============= Token yield =============
//
// See the Phase 2b PR description for the full arithmetic. In short:
// average win ≈ 20 + 20 + 13.5(avg tier) * 2 ≈ 67 tokens, average loss = 20,
// so at a rough 60% win rate a campaign run earns ~48 tokens/match. Over the
// ~150-match horizon cardProgression.ts documents for maxing an XI, that's
// ~7,200 tokens ≈ 29 packs (250 tokens each) ≈ one pack roughly every 5
// matches — enough to build and rotate a real roster without the pack
// economy outrunning the level climb.

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
