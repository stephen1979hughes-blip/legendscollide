/**
 * The engine's own data contract.
 *
 * These types are deliberately duplicated rather than imported from the web
 * app: the engine is the half that gets reimplemented in Rust, so it must not
 * depend on anything React-side. The web app adapts its own types to these at
 * the call site.
 */

export type PositionCategory = 'GK' | 'DF' | 'MF' | 'FW';

export interface EnginePlayer {
  id: string;
  name: string;
  /** Detailed position (GK, CB, LB, CM, ST, …); bucketed internally. */
  position: string;
  overallRating: number;
  attackRating: number;
  defenceRating: number;
  stamina: number;
}

export interface EngineTeam {
  id: string;
  name: string;
  players: EnginePlayer[];
}

export interface Goal {
  minute: number;
  playerName: string;
  teamId: string;
  assist?: string;
  isPenalty?: boolean;
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
  events: MatchEvent[];
  playerStatsA?: { [playerName: string]: PlayerStats };
  playerStatsB?: { [playerName: string]: PlayerStats };
}

export interface MatchInput {
  teamA: EngineTeam;
  teamB: EngineTeam;
  /**
   * Seed for the match PRNG. The same seed and teams must always produce the
   * same MatchResult — that property is what lets a future Rust engine be
   * diffed against this one for parity.
   */
  seed: number;
}

/**
 * The swap point. Any implementation satisfying this — the TypeScript engine
 * today, a Rust/WASM module later — can be dropped into the web app.
 */
export interface MatchEngine {
  readonly name: string;
  simulate(input: MatchInput): MatchResult;
}
