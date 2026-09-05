/**
 * Token balance (Phase 2b). Follows the same localStorage-only pattern as
 * cardCollectionStorage.ts and customXIStorage.ts — no accounts, no backend.
 */
const STORAGE_KEY = 'legends_collide_tokens';

function load(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const value = raw ? Number(raw) : 0;
    return Number.isFinite(value) && value >= 0 ? value : 0;
  } catch (error) {
    console.error('Failed to load token balance:', error);
    return 0;
  }
}

function persist(balance: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(balance));
  } catch (error) {
    console.error('Failed to save token balance:', error);
  }
}

export const tokenStorage = {
  getBalance: (): number => load(),

  /** Credits `amount` tokens and returns the new balance. */
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
