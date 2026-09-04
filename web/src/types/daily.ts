/**
 * The daily fixture: one deterministic, worldwide-identical match per UTC day.
 * See web/src/utils/dailyFixture.ts for how it's derived.
 */
export interface DailyFixture {
  /** Days since the fixture epoch. Also the "Day N" shown to players. */
  dayNumber: number;
  /** UTC calendar date, 'YYYY-MM-DD'. */
  dateKey: string;
  teamAId: string;
  teamBId: string;
  /** Seed passed straight to the match engine — fixed per day. */
  seed: number;
}

export type MatchOutcome = 'A' | 'B' | 'draw';

export interface DailyPrediction {
  scoreA: number;
  scoreB: number;
  scorerId: string;
  scorerName: string;
  scorerTeam: 'A' | 'B';
}

export interface DailyCorrectness {
  outcome: boolean;
  exactScore: boolean;
  scorer: boolean;
}

/** A completed day, as stored in localStorage. */
export interface DailyRecord {
  dayNumber: number;
  dateKey: string;
  teamAId: string;
  teamBId: string;
  teamAName: string;
  teamBName: string;
  seed: number;
  prediction: DailyPrediction;
  actual: {
    scoreA: number;
    scoreB: number;
    outcome: MatchOutcome;
  };
  correctness: DailyCorrectness;
  completedAt: string;
}

export interface StreakStats {
  currentStreak: number;
  bestStreak: number;
  gamesPlayed: number;
  outcomeCorrect: number;
  exactScoreCorrect: number;
  scorerCorrect: number;
}

/** Passed from DailyChallenge -> Broadcast -> DailyResult via location.state. */
export interface DailyCompletionState {
  matchResult: import('./index').MatchResult;
  teamA: import('./index').Team;
  teamB: import('./index').Team;
  fixture: DailyFixture;
  prediction: DailyPrediction;
}
