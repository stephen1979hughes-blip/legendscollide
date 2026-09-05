/**
 * Card progression maths (Phase 2a of the roadmap).
 *
 * A card enters the collection at a common floor and climbs to its true
 * rating by being played — the one lever that fixes the 7.0-point headroom
 * problem described in ROADMAP.md. This module is deliberately engine-
 * agnostic: packages/match-engine/ never hears the word "level" (see
 * CLAUDE.md's "the engine is deliberately separable" section). It is the
 * seam that turns (true rating, level) into the plain rating the engine
 * actually simulates; services/api.ts is the only caller, at the point
 * where it builds an EngineTeam.
 */

export const MAX_CARD_LEVEL = 10;

/**
 * Every level-1 card, regardless of who it is, plays at this rating —
 * overall, attack and defence alike. A card's *ceiling* (its true rating) is
 * what makes it worth pulling; its level is what makes it worth playing.
 * Collapsing every fresh card to the same floor is deliberate: it
 * manufactures the bronze tier the dataset doesn't have (95% of the 414
 * players sit at 80+) without inventing weak players, and it means
 * levelling up a 78-rated squad player is a genuinely worse use of XP than
 * levelling a 94-rated one — only the second card has anywhere to go.
 */
export const CARD_RATING_FLOOR = 75;

/**
 * Maps a player's true rating and a card's level to the rating actually
 * simulated. Applied independently to overall, attack and defence — all
 * three scale off the same level together, so a card can't be levelled for
 * attack while staying a defensive liability (or vice versa); there is one
 * knob per card, not three. Pure and total: level is clamped to
 * [1, MAX_CARD_LEVEL] so any input still returns a sane rating.
 */
export function effectiveRating(trueRating: number, level: number): number {
  const clampedLevel = Math.min(MAX_CARD_LEVEL, Math.max(1, Math.round(level)));
  const progress = (clampedLevel - 1) / (MAX_CARD_LEVEL - 1);
  const rating = CARD_RATING_FLOOR + (trueRating - CARD_RATING_FLOOR) * progress;
  // Whole numbers only — every rating elsewhere in the dataset (and the
  // engine's own inputs) is an integer; a ".7" here read as a display bug.
  return Math.round(rating);
}

// ============= XP =============
//
// XP required to advance from `level` to `level + 1` grows geometrically —
// early levels come quickly (a new pull already feels like it's improving),
// later ones are a real commitment. The full climb from level 1 to 10 is
// ~3,970 XP.
//
// Phase 2c: this is no longer XP that's automatically credited to whichever
// cards were fielded — it's paid out of the shared wallet (xpWallet.ts),
// earned from match outcomes (campaignLadder.ts's xpForMatch), trivia rounds
// (triviaGenerator.ts) and card sacrifice (sacrifice.ts), and spent by the
// player choosing which card to invest it in (Collection.tsx).

const XP_LEVEL_BASE = 100;
const XP_LEVEL_GROWTH = 1.35;

/** XP required to advance from `level` to `level + 1`. Zero once maxed. */
export function xpToNextLevel(level: number): number {
  if (level >= MAX_CARD_LEVEL) return 0;
  return Math.round(XP_LEVEL_BASE * XP_LEVEL_GROWTH ** (level - 1));
}

/**
 * XP a duplicate pull converts into for the card already owned. Worth a
 * few games' XP at level 1 — where it can jump a fresh card several
 * levels — but only a sliver of what a near-maxed card still needs, so
 * duplicates matter most exactly when a collection is thinnest.
 */
export const DUPLICATE_XP_VALUE = 300;

export interface LevelProgress {
  level: number;
  /** XP accumulated toward the next level. Always 0 once maxed. */
  xp: number;
}

/**
 * Applies gained XP to a card's progress, cascading through as many
 * level-ups as the XP covers. A maxed card absorbs no further XP — there is
 * nothing left to spend it on, so it is discarded rather than stockpiled.
 */
export function applyXp(progress: LevelProgress, gained: number): LevelProgress {
  if (progress.level >= MAX_CARD_LEVEL) return { level: MAX_CARD_LEVEL, xp: 0 };

  let level = progress.level;
  let xp = progress.xp + gained;

  while (level < MAX_CARD_LEVEL) {
    const need = xpToNextLevel(level);
    if (xp < need) break;
    xp -= need;
    level += 1;
  }

  return level >= MAX_CARD_LEVEL ? { level: MAX_CARD_LEVEL, xp: 0 } : { level, xp };
}
