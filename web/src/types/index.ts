export interface Player {
  id: string;
  name: string;
  position: 'GK' | 'DF' | 'MF' | 'FW';
  overallRating: number;
  attackRating: number;
  defenceRating: number;
  stamina: number;
}

export interface Team {
  id: string;
  name: string;
  year: number;
  players: Player[];
}

export interface TeamSummary {
  id: string;
  name: string;
  year: number;
  playerCount: number;
}

export interface Goal {
  minute: number;
  playerName: string;
  teamId: string;
}

export interface MatchStats {
  shotsA: number;
  shotsB: number;
  shotsOnTargetA: number;
  shotsOnTargetB: number;
  possessionA: number;
  possessionB: number;
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
}
