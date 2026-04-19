export interface Player {
  id: string;
  name: string;
  position: 'GK' | 'DF' | 'MF' | 'FW';
  overallRating: number;
  attackRating: number;
  defenceRating: number;
  stamina: number;
  nationality?: string;
  eraAppearances?: number[];  // Years player appeared
}

export interface Club {
  id: string;
  name: string;
  shortName: string;
  description?: string;
  allTimePlayers?: Player[];  // Aggregated players across all eras
}

export interface Team {
  id: string;
  name: string;
  clubId: string;
  year: number;
  season?: string;
  description?: string;
  players: Player[];
}

export interface TeamSummary {
  id: string;
  name: string;
  clubId: string;
  year: number;
  playerCount: number;
}

export interface Goal {
  minute: number;
  playerName: string;
  teamId: string;
  assist?: string;  // Assisting player name
  isPenalty?: boolean;  // Whether goal was from a penalty
}

export interface MatchStats {
  shotsA: number;
  shotsB: number;
  shotsOnTargetA: number;
  shotsOnTargetB: number;
  possessionA: number;
  possessionB: number;
}

export interface MatchEvent {
  minute: number;
  type: 'goal' | 'normal' | 'highlight';
  text: string;
  scoreA: number;
  scoreB: number;
  goalScorerName?: string;
}

export interface MatchResult {
  scoreA: number;
  scoreB: number;
  goalsA: Goal[];
  goalsB: Goal[];
  stats: MatchStats;
  commentary: string[];
  stadiumName: string;
  kickOffTime: string;
  manOfTheMatch: string;
  eraFlavour?: string;
  events: MatchEvent[];
}
