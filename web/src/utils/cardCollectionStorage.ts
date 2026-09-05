import { Card, Collection } from '../types/collection';
import { applyXp, DUPLICATE_XP_VALUE } from './cardProgression';

// Follows the pattern in customXIStorage.ts: no accounts, no backend, just
// localStorage. Card levels are game state the engine never sees — see
// cardProgression.ts and CLAUDE.md's "the engine is deliberately separable".
const STORAGE_KEY = 'legends_collide_card_collection';

function load(): Collection {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Failed to load card collection:', error);
    return {};
  }
}

function persist(collection: Collection): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collection));
  } catch (error) {
    console.error('Failed to save card collection:', error);
  }
}

export const cardCollectionStorage = {
  loadAll: (): Collection => load(),

  get: (playerId: string): Card | null => load()[playerId] ?? null,

  /**
   * Registers a pack pull for `playerId`. A new player id enters the
   * collection at level 1; a player already owned is a duplicate, and the
   * pull is converted into XP for the existing card instead of a second copy.
   */
  acquire: (playerId: string): Card => {
    const collection = load();
    const existing = collection[playerId];
    const card: Card = existing
      ? { playerId, ...applyXp(existing, DUPLICATE_XP_VALUE) }
      : { playerId, level: 1, xp: 0 };
    collection[playerId] = card;
    persist(collection);
    return card;
  },

  /** Applies match-earned XP to an owned card. No-op (returns null) if the card isn't owned. */
  grantXp: (playerId: string, amount: number): Card | null => {
    const collection = load();
    const existing = collection[playerId];
    if (!existing) return null;
    const card: Card = { playerId, ...applyXp(existing, amount) };
    collection[playerId] = card;
    persist(collection);
    return card;
  },

  /** Removes a card entirely (Phase 2c sacrifice) — it can be pulled fresh from a pack again later. */
  remove: (playerId: string): void => {
    const collection = load();
    delete collection[playerId];
    persist(collection);
  },

  clear: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear card collection:', error);
    }
  },
};
