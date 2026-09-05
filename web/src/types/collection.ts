/** A single owned card: one player id, levelled independently of any team. */
export interface Card {
  playerId: string;
  level: number;
  /** XP accumulated toward the next level. Always 0 once maxed. */
  xp: number;
}

/** The player's full collection, keyed by player id — at most one card per player; a duplicate pull feeds the existing card XP instead of stacking. */
export type Collection = Record<string, Card>;
