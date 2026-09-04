import { DailyRecord, StreakStats } from '../types/daily';

const HISTORY_KEY = 'legends_collide_daily_history';

type History = Record<string, DailyRecord>; // keyed by dayNumber, as a string

function loadHistory(): History {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Failed to load daily challenge history:', error);
    return {};
  }
}

function writeHistory(history: History): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save daily challenge history:', error);
  }
}

/**
 * Streak/history is trusted entirely off the device clock — there's no server
 * to check it against. Each completed day is keyed by its computed day
 * number, so winding the clock back to a day already played just replays
 * that day's stored result (no re-answer, no streak damage); winding it
 * forward lets someone play ahead of real time, which is the cheap, accepted
 * cost of having no backend rather than something actively defended against.
 */
export const dailyChallengeStorage = {
  hasRecord(dayNumber: number): boolean {
    return !!loadHistory()[String(dayNumber)];
  },

  getRecord(dayNumber: number): DailyRecord | null {
    return loadHistory()[String(dayNumber)] ?? null;
  },

  /** Write-once: a day's record never changes once saved. Safe to call twice
   * (e.g. React StrictMode's double effect invocation in dev). */
  saveRecord(record: DailyRecord): void {
    const history = loadHistory();
    const key = String(record.dayNumber);
    if (history[key]) return;
    history[key] = record;
    writeHistory(history);
  },

  getStreakStats(todayDayNumber: number): StreakStats {
    const history = loadHistory();
    const days = Object.values(history);

    let currentStreak = 0;
    let cursor = history[String(todayDayNumber)] ? todayDayNumber : todayDayNumber - 1;
    while (history[String(cursor)]) {
      currentStreak++;
      cursor--;
    }

    const dayNumbers = days.map((d) => d.dayNumber).sort((a, b) => a - b);
    let bestStreak = 0;
    let run = 0;
    let prev: number | null = null;
    for (const d of dayNumbers) {
      run = prev !== null && d === prev + 1 ? run + 1 : 1;
      bestStreak = Math.max(bestStreak, run);
      prev = d;
    }
    bestStreak = Math.max(bestStreak, currentStreak);

    return {
      currentStreak,
      bestStreak,
      gamesPlayed: days.length,
      outcomeCorrect: days.filter((d) => d.correctness.outcome).length,
      exactScoreCorrect: days.filter((d) => d.correctness.exactScore).length,
      scorerCorrect: days.filter((d) => d.correctness.scorer).length,
    };
  },
};
