/** One rung of the campaign ladder — a classic team, ordered by squad strength. */
export interface CampaignTier {
  /** 1-indexed position in the ladder (weakest = 1). Drives the token bonus and unlock order. */
  tier: number;
  teamId: string;
  teamName: string;
  year: number;
  /** Mean overallRating across the team's players — what the ladder is sorted by. */
  rating: number;
}

/** Passed from Campaign -> CustomXIBuilder via location.state to pin the opponent and force the collection-sourced squad. */
export interface CampaignMatchRequest {
  campaignTeamId: string;
}

export interface CampaignRewardCard {
  playerId: string;
  playerName: string;
  isDuplicate: boolean;
}

export type MatchOutcome = 'win' | 'draw' | 'loss';

/**
 * Passed from CustomXIBuilder -> Broadcast -> CampaignResult via
 * location.state. Phase 2c: XP from a match lands in the shared wallet
 * (xpWallet.ts) rather than auto-crediting whichever 11 cards were fielded —
 * there is no more per-card XP breakdown to show here, just the total earned
 * and a nudge toward Collection to spend it.
 */
export interface CampaignCompletionState {
  matchResult: import('./index').MatchResult;
  teamA: import('./index').Team;
  teamB: import('./index').Team;
  tier: CampaignTier;
  outcome: MatchOutcome;
  xpEarned: number;
  newBalance: number;
  unlockedNextTier: boolean;
  nextTier: CampaignTier | null;
  themedPack: CampaignRewardCard | null;
}
