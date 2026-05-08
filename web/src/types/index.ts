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

export type TeamSide = 'home' | 'away';

export interface Team {
  id: string;
  name: string;
  clubId: string;
  year: number;
  season?: string;
  description?: string;
  players: Player[];
  side?: TeamSide; // Optional: used in match engine
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
  type: 'goal' | 'normal' | 'highlight' | 'card' | 'skill';
  text: string;
  scoreA: number;
  scoreB: number;
  goalScorerName?: string;
  playerName?: string;
  playerTeam?: 'A' | 'B';
  cardType?: 'yellow' | 'red';
  skillType?: 'tackle' | 'block' | 'clearance' | 'dribble' | 'pass' | 'save' | 'punch';
}

export interface PlayerStats {
  tackles: number;
  clearances: number;
  dribbles: number;
  passes: number;
  saves: number;
  punches: number;
  shotsOnTarget: number;
  yellowCards: number;
  redCards: number;
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
  playerStatsA?: { [playerName: string]: PlayerStats };
  playerStatsB?: { [playerName: string]: PlayerStats };
}
