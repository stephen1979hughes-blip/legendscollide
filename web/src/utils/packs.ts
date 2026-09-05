/**
 * Pack economy (Phase 2b of the roadmap).
 *
 * Packs are how tokens (see tokenStorage.ts) turn into cards. Rarity is
 * layered on top of the dataset's own rating distribution rather than
 * reproducing it: a pack's odds are deliberately more top-heavy-averse than
 * the population share of each tier, so pulling a 90+ rated legend still
 * feels rare even though ~9% of the 414-player pool sits at 90+.
 *
 * See ROADMAP.md's Phase 2 section and the token/pack arithmetic in the
 * Phase 2b PR description for how PACK_COST and PACK_SIZE were chosen against
 * the ~150-match climb cardProgression.ts documents.
 */
import { Rng, randomSeed } from '@fm/match-engine';
import { Player } from '../types';
import { cardCollectionStorage } from './cardCollectionStorage';
import { Card } from '../types/collection';
import { coarsePosition, CoarsePosition } from './position';

export interface RarityTier {
  id: 'legendary' | 'epic' | 'rare' | 'uncommon' | 'common';
  label: string;
  /** Inclusive lower bound on true (ceiling) rating. */
  min: number;
  /** Pack-opening odds. Sums to 1 across all tiers. */
  weight: number;
}

/**
 * Population shares in the actual 414-player dataset (measured 2026-09-05):
 * 90+ ~9%, 87-89 ~27%, 84-86 ~34%, 80-83 ~25%, <80 ~5%. Pack odds below
 * deliberately underweight the two strongest tiers relative to that
 * population and overweight the bottom two, so a pull earns its rarity
 * label instead of just mirroring "how many exist".
 */
export const RARITY_TIERS: RarityTier[] = [
  { id: 'legendary', label: 'Legendary', min: 90, weight: 0.04 },
  { id: 'epic', label: 'Epic', min: 87, weight: 0.13 },
  { id: 'rare', label: 'Rare', min: 84, weight: 0.33 },
  { id: 'uncommon', label: 'Uncommon', min: 80, weight: 0.4 },
  { id: 'common', label: 'Common', min: 0, weight: 0.1 },
];

/** Tokens per pack. See the Phase 2b write-up for the pacing arithmetic. */
export const PACK_COST = 250;
/** Cards per pack. */
export const PACK_SIZE = 3;

/** A one-time, free starter squad so a new player can field an XI before ever owning tokens. */
export const STARTER_SQUAD_MINIMUMS: Record<CoarsePosition, number> = {
  GK: 2,
  DF: 6,
  MF: 7,
  FW: 5,
};

function tierFor(rating: number): RarityTier {
  return RARITY_TIERS.find((t) => rating >= t.min) ?? RARITY_TIERS[RARITY_TIERS.length - 1];
}

function tierPool(pool: Player[], tier: RarityTier): Player[] {
  const upperBound = RARITY_TIERS[RARITY_TIERS.indexOf(tier) - 1]?.min ?? Infinity;
  return pool.filter((p) => p.overallRating >= tier.min && p.overallRating < upperBound);
}

function pickWeightedTier(rng: Rng): RarityTier {
  const roll = rng.next();
  let cumulative = 0;
  for (const tier of RARITY_TIERS) {
    cumulative += tier.weight;
    if (roll < cumulative) return tier;
  }
  return RARITY_TIERS[RARITY_TIERS.length - 1];
}

/** Rolls `count` players from `pool` at the standard rarity odds. Pure — the caller supplies the Rng. */
export function rollPack(pool: Player[], rng: Rng, count: number = PACK_SIZE): Player[] {
  const picks: Player[] = [];
  for (let i = 0; i < count; i++) {
    const tier = pickWeightedTier(rng);
    const candidates = tierPool(pool, tier);
    // A thin tier (or a filtered-down pool, e.g. one coarse position) can be
    // empty — fall back to the full pool rather than picking nothing.
    picks.push(rng.pick(candidates.length > 0 ? candidates : pool));
  }
  return picks;
}

/**
 * Rolls a starter squad: enough players per coarse position (see
 * STARTER_SQUAD_MINIMUMS) that any of the five formations in
 * types/customXI.ts can be filled immediately, at standard rarity odds
 * within each position group. Free, one-time, and never repeated — see
 * campaignStorage.ts's starter-grant flag.
 */
export function rollStarterSquad(pool: Player[], rng: Rng): Player[] {
  const picks: Player[] = [];
  const taken = new Set<string>();

  for (const [category, minCount] of Object.entries(STARTER_SQUAD_MINIMUMS) as [CoarsePosition, number][]) {
    const categoryPool = pool.filter((p) => coarsePosition(p.position) === category);
    for (let i = 0; i < minCount; i++) {
      const tier = pickWeightedTier(rng);
      const candidates = tierPool(categoryPool, tier).filter((p) => !taken.has(p.id));
      const fallback = categoryPool.filter((p) => !taken.has(p.id));
      const options = candidates.length > 0 ? candidates : fallback;
      if (options.length === 0) continue;
      const player = rng.pick(options);
      taken.add(player.id);
      picks.push(player);
    }
  }
  return picks;
}

export interface PackPull {
  player: Player;
  tier: RarityTier;
  isDuplicate: boolean;
  card: Card;
}

/** Rolls and applies `count` cards to the collection, converting duplicates to XP via cardCollectionStorage.acquire. */
export function openPack(pool: Player[], count: number = PACK_SIZE): PackPull[] {
  const rng = new Rng(randomSeed());
  return rollPack(pool, rng, count).map((player) => {
    const isDuplicate = !!cardCollectionStorage.get(player.id);
    const card = cardCollectionStorage.acquire(player.id);
    return { player, tier: tierFor(player.overallRating), isDuplicate, card };
  });
}

/** Grants the free starter squad and applies it to the collection. */
export function openStarterSquad(pool: Player[]): PackPull[] {
  const rng = new Rng(randomSeed());
  return rollStarterSquad(pool, rng).map((player) => {
    const card = cardCollectionStorage.acquire(player.id);
    return { player, tier: tierFor(player.overallRating), isDuplicate: false, card };
  });
}
