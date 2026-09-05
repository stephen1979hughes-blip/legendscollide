/**
 * The XP wallet (Phase 2c). Replaces the separate "tokens" currency from
 * Phase 2b: matches and trivia both pay into one balance, and the player
 * decides afterward whether to spend it on packs or on directly investing
 * in a specific card's level (see cardCollectionStorage.grantXp) — leveling
 * is no longer something that happens automatically just for fielding a
 * card. Same localStorage-only pattern as the rest of the storage modules.
 */
const STORAGE_KEY = 'legends_collide_xp_wallet';

function load(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const value = raw ? Number(raw) : 0;
    return Number.isFinite(value) && value >= 0 ? value : 0;
  } catch (error) {
    console.error('Failed to load XP wallet:', error);
    return 0;
  }
}

function persist(balance: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(balance));
  } catch (error) {
    console.error('Failed to save XP wallet:', error);
  }
}

export const xpWallet = {
  getBalance: (): number => load(),

  /** Credits `amount` XP and returns the new balance. */
  earn: (amount: number): number => {
    const balance = load() + Math.max(0, Math.round(amount));
    persist(balance);
    return balance;
  },

  /** Deducts `amount` if affordable. Returns false (no-op) if the balance is too low. */
  spend: (amount: number): boolean => {
    const balance = load();
    if (amount <= 0 || balance < amount) return false;
    persist(balance - amount);
    return true;
  },
};
