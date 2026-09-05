/**
 * Sacrificing a card (Phase 2c): trade an owned card you're not fielding for
 * a weighted XP payout into the wallet — the riskier sibling of a duplicate
 * pack pull's guaranteed (and flat) DUPLICATE_XP_VALUE. The card is deleted
 * outright, not soft-locked: it can be pulled fresh from a pack again later.
 *
 * The payout scales with the sacrificed card's *true* rating rather than
 * being flat, unlike DUPLICATE_XP_VALUE — sacrificing a 90-rated legend
 * should cost (and pay) more than sacrificing a fringe 78-rated squad
 * player, so it reads as a real decision (bank it now vs. keep its future
 * potential) rather than an obviously-correct cleanup action.
 */
import { Rng, randomSeed } from '@fm/match-engine';

export interface SacrificeTier {
  id: 'bust' | 'solid' | 'jackpot';
  label: string;
  /** Roll odds. Sums to 1. */
  weight: number;
  /** Multiplies the rating-based base payout. */
  multiplier: number;
}

export const SACRIFICE_TIERS: SacrificeTier[] = [
  { id: 'bust', label: 'Bust', weight: 0.55, multiplier: 0.4 },
  { id: 'solid', label: 'Solid', weight: 0.35, multiplier: 1.0 },
  { id: 'jackpot', label: 'Jackpot', weight: 0.1, multiplier: 2.5 },
];

/** Base payout per point of true rating, before the tier multiplier. A rating-85 card's "solid" roll pays 340 XP — a bit more than a full quiz round. */
export const SACRIFICE_BASE_PER_RATING = 4;

export interface SacrificeResult {
  tier: SacrificeTier;
  xp: number;
}

function pickTier(rng: Rng): SacrificeTier {
  const roll = rng.next();
  let cumulative = 0;
  for (const tier of SACRIFICE_TIERS) {
    cumulative += tier.weight;
    if (roll < cumulative) return tier;
  }
  return SACRIFICE_TIERS[SACRIFICE_TIERS.length - 1];
}

/** Rolls a sacrifice payout for a card of the given true rating. Fresh randomness each time — there's no replay/sharing use case for "redo this roll". */
export function rollSacrifice(trueRating: number): SacrificeResult {
  const rng = new Rng(randomSeed());
  const tier = pickTier(rng);
  const xp = Math.round(trueRating * SACRIFICE_BASE_PER_RATING * tier.multiplier);
  return { tier, xp };
}
