import { DailyRecord } from '../types/daily';
import { SITE_URL } from '../config';

/**
 * Wordle-style spoiler-free share text.
 *
 * Three squares, one per prediction dimension, in a fixed order: outcome,
 * exact score, scorer. Each is just correct/incorrect (green vs. gray) — no
 * square ever carries a number, a team name, or which side won, so reading
 * the string teaches you nothing about the actual result, only how well the
 * sender predicted it.
 */
export function buildShareString(record: DailyRecord): string {
  const squares = [record.correctness.outcome, record.correctness.exactScore, record.correctness.scorer]
    .map((correct) => (correct ? '\u{1F7E9}' : '⬜'))
    .join('');

  const correctCount = [record.correctness.outcome, record.correctness.exactScore, record.correctness.scorer].filter(
    Boolean
  ).length;

  return [`Legends Collide #${record.dayNumber}`, `${squares} ${correctCount}/3`, SITE_URL].join('\n');
}
