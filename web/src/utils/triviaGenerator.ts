/**
 * Trivia question generation (Phase 2c).
 *
 * Deliberately generated from facts every record already has (team
 * membership, position, nationality) rather than authored per-player —
 * only 137 of 414 players have a written bio, so "what do you know about
 * this specific man" fails for most of the pool (nobody expects to know
 * 1954 Hungary's reserve full-backs). These five question types instead
 * draw on data that's universal or near-universal across the dataset, so
 * coverage isn't bottlenecked on content that doesn't exist yet. Bios can
 * layer in later as a bonus type for the players who have them.
 *
 * Procedural rather than a stored bank: with 414 players, 26 teams and 43
 * countries, the combinatorics alone produce thousands of distinct
 * question instances without needing to author or store them.
 */
import { Rng, randomSeed } from '@fm/match-engine';
import { Player, Team, Club } from '../types';
import { CountryRef } from './dataProcessor';
import { coarsePosition } from './position';

export interface TriviaQuestion {
  prompt: string;
  options: string[];
  correctIndex: number;
}

export interface TriviaContext {
  players: Player[];
  teams: Team[];
  /** club or country name, keyed by Team.clubId — see dataProcessor.ts: a classic team's `clubId` is a real club id for club sides and a country id for national sides. */
  fielderNameByClubId: Map<string, string>;
  /** real nation names only, keyed by country id — a player's `nationality` always resolves here. */
  countryNameById: Map<string, string>;
}

const POSITION_LABELS: Record<ReturnType<typeof coarsePosition>, string> = {
  GK: 'Goalkeeper',
  DF: 'Defender',
  MF: 'Midfielder',
  FW: 'Forward',
};

export function buildTriviaContext(players: Player[], teams: Team[], clubs: Club[], countries: CountryRef[]): TriviaContext {
  // `clubs` (from dataProcessor.ts) holds one entry per actual club *and* one
  // per country, both with a clean display name — "Manchester United", not
  // "Manchester United 1968" the way the Team's own name reads. A classic
  // team's `clubId` is a real club id for club sides and a country id for
  // national sides (see dataProcessor.ts), so this one map resolves either.
  const fielderNameByClubId = new Map(clubs.map((c) => [c.id, c.name]));

  return {
    players,
    teams,
    fielderNameByClubId,
    countryNameById: new Map(countries.map((c) => [c.id, c.name])),
  };
}

interface PlayerTeamPair {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
}

function buildPairs(ctx: TriviaContext): PlayerTeamPair[] {
  const pairs: PlayerTeamPair[] = [];
  for (const team of ctx.teams) {
    for (const p of team.players) {
      pairs.push({
        playerId: p.id,
        playerName: p.name,
        teamId: team.id,
        teamName: team.name,
      });
    }
  }
  return pairs;
}

function shuffleOptions(rng: Rng, correct: string, distractors: string[]): { options: string[]; correctIndex: number } {
  const tagged = [correct, ...distractors].map((label, i) => ({ label, isCorrect: i === 0 }));
  const shuffled = rng.shuffle(tagged);
  return {
    options: shuffled.map((t) => t.label),
    correctIndex: shuffled.findIndex((t) => t.isCorrect),
  };
}

/** Picks `count` distinct items from `pool` (by `keyFn`), excluding whatever `keyFn(excludeKey)` produces. */
function pickDistinct<T>(rng: Rng, pool: T[], count: number, keyFn: (t: T) => string, excludeKey: string): T[] {
  const seen = new Set([excludeKey]);
  const out: T[] = [];
  for (const item of rng.shuffle(pool)) {
    const key = keyFn(item);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
    if (out.length === count) break;
  }
  return out;
}

// ============= Round scoring =============
//
// No daily cap (client-trusted, same as every other storage in this app —
// there's no anti-cheat surface until Phase 6). What keeps this from just
// being a faster grind than playing matches is that every question demands
// an actual answer, and "doing well gives a lot": the completion bonus is
// quadratic in the score fraction, so a strong round pays disproportionately
// more than a middling one rather than XP just accumulating linearly.
// A perfect round: 8 * 10 + 60 = 140 XP — more than even a hard-fought
// campaign win. A 4/8 round: 40 + 15 = 55 XP — closer to a loss.

export const QUIZ_ROUND_SIZE = 8;
export const XP_PER_CORRECT_ANSWER = 10;
const COMPLETION_BONUS_MAX = 60;

export function quizCompletionBonus(correct: number, total: number = QUIZ_ROUND_SIZE): number {
  if (total <= 0) return 0;
  const fraction = correct / total;
  return Math.round(COMPLETION_BONUS_MAX * fraction * fraction);
}

export function quizRoundXp(correct: number, total: number = QUIZ_ROUND_SIZE): number {
  return correct * XP_PER_CORRECT_ANSWER + quizCompletionBonus(correct, total);
}

type QuestionType = 'player-team' | 'player-position' | 'player-nationality' | 'team-roster' | 'team-fielder';

const QUESTION_TYPES: QuestionType[] = [
  'player-team',
  'player-position',
  'player-nationality',
  'team-roster',
  'team-fielder',
];

/** Generates one random multiple-choice question. Pure aside from its Rng — pass a fixed seed in tests for a reproducible question. */
export function generateQuestion(ctx: TriviaContext, rng: Rng = new Rng(randomSeed())): TriviaQuestion | null {
  const pairs = buildPairs(ctx);
  if (pairs.length === 0 || ctx.players.length === 0) return null;

  const type = rng.pick(QUESTION_TYPES);

  switch (type) {
    case 'player-team': {
      const pair = rng.pick(pairs);
      const distractorTeamNames = pickDistinct(rng, ctx.teams, 3, (t) => t.id, pair.teamId).map((t) => t.name);
      if (distractorTeamNames.length < 3) return generateQuestion(ctx, rng);
      const { options, correctIndex } = shuffleOptions(rng, pair.teamName, distractorTeamNames);
      return { prompt: `Which classic team did ${pair.playerName} play for?`, options, correctIndex };
    }

    case 'player-position': {
      const player = rng.pick(ctx.players);
      const correct = POSITION_LABELS[coarsePosition(player.position)];
      const distractors = Object.values(POSITION_LABELS).filter((label) => label !== correct);
      const { options, correctIndex } = shuffleOptions(rng, correct, distractors);
      return { prompt: `What position did ${player.name} play?`, options, correctIndex };
    }

    case 'player-nationality': {
      const withNationality = ctx.players.filter((p) => p.nationality && ctx.countryNameById.has(p.nationality));
      if (withNationality.length === 0) return generateQuestion(ctx, rng);
      const player = rng.pick(withNationality);
      const correct = ctx.countryNameById.get(player.nationality!)!;
      const allCountryNames = [...ctx.countryNameById.entries()];
      const distractors = pickDistinct(rng, allCountryNames, 3, ([id]) => id, player.nationality!).map(([, name]) => name);
      if (distractors.length < 3) return generateQuestion(ctx, rng);
      const { options, correctIndex } = shuffleOptions(rng, correct, distractors);
      return { prompt: `What nationality is ${player.name}?`, options, correctIndex };
    }

    case 'team-roster': {
      const team = rng.pick(ctx.teams);
      if (team.players.length === 0) return generateQuestion(ctx, rng);
      const correctPlayer = rng.pick(team.players);
      const rosterIds = new Set(team.players.map((p) => p.id));
      const distractorPool = ctx.players.filter((p) => !rosterIds.has(p.id));
      const distractors = pickDistinct(rng, distractorPool, 3, (p) => p.id, correctPlayer.id).map((p) => p.name);
      if (distractors.length < 3) return generateQuestion(ctx, rng);
      const { options, correctIndex } = shuffleOptions(rng, correctPlayer.name, distractors);
      return {
        // team.name already ends in its year ("Spain 2012") — appending
        // "(${team.year})" duplicated it into "Spain 2012 (2012)".
        prompt: `Which of these players played for ${team.name}?`,
        options,
        correctIndex,
      };
    }

    case 'team-fielder': {
      // Every classic team's name is literally "{club or nation} {year}"
      // (dataProcessor.ts builds it that way), so naming the team in the
      // prompt gives the answer away outright — "Which club or nation
      // fielded Spain 2012?" answers itself. Identifying the team by one of
      // its actual players instead asks something a name can't leak.
      const team = rng.pick(ctx.teams);
      if (team.players.length === 0) return generateQuestion(ctx, rng);
      const correct = ctx.fielderNameByClubId.get(team.clubId);
      if (!correct) return generateQuestion(ctx, rng);
      const identifyingPlayer = rng.pick(team.players);
      const allFielderNames = [...ctx.fielderNameByClubId.entries()];
      const distractors = pickDistinct(rng, allFielderNames, 3, ([id]) => id, team.clubId).map(([, name]) => name);
      if (distractors.length < 3) return generateQuestion(ctx, rng);
      const { options, correctIndex } = shuffleOptions(rng, correct, distractors);
      return {
        prompt: `Which club or nation fielded a team including ${identifyingPlayer.name} in ${team.year}?`,
        options,
        correctIndex,
      };
    }
  }
}
