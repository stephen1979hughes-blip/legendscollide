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

/** Passed from CustomXIBuilder -> Broadcast -> CampaignResult via location.state. */
export interface CampaignCompletionState {
  matchResult: import('./index').MatchResult;
  teamA: import('./index').Team;
  teamB: import('./index').Team;
  tier: CampaignTier;
  won: boolean;
  tokensEarned: number;
  newBalance: number;
  xpGained: Array<{ playerId: string; playerName: string; before: { level: number; xp: number }; after: { level: number; xp: number } }>;
  unlockedNextTier: boolean;
  nextTier: CampaignTier | null;
  themedPack: CampaignRewardCard | null;
}
