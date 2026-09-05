/**
 * Campaign progress (Phase 2b): which ladder tiers have been beaten at least
 * once, plus the one-time starter-squad flag. localStorage-only, same
 * pattern as the rest of the collection/progression storage modules.
 */
const STORAGE_KEY = 'legends_collide_campaign_progress';
const STARTER_KEY = 'legends_collide_starter_squad_granted';

interface Progress {
  /** Team ids beaten at least once. A tier stays unlocked and replayable forever once defeated. */
  defeatedTeamIds: string[];
}

function load(): Progress {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : { defeatedTeamIds: [] };
  } catch (error) {
    console.error('Failed to load campaign progress:', error);
    return { defeatedTeamIds: [] };
  }
}

function persist(progress: Progress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Failed to save campaign progress:', error);
  }
}

export const campaignStorage = {
  isDefeated: (teamId: string): boolean => load().defeatedTeamIds.includes(teamId),

  /** Marks a tier defeated. Idempotent — replaying an already-beaten tier is a no-op here. */
  recordWin: (teamId: string): void => {
    const progress = load();
    if (progress.defeatedTeamIds.includes(teamId)) return;
    progress.defeatedTeamIds.push(teamId);
    persist(progress);
  },

  /** A tier is playable once its predecessor is beaten; tier 1 is always open. */
  isUnlocked: (tierIndex: number, ladderOrderedTeamIds: string[]): boolean => {
    if (tierIndex <= 1) return true;
    const previousTeamId = ladderOrderedTeamIds[tierIndex - 2];
    return previousTeamId ? campaignStorage.isDefeated(previousTeamId) : false;
  },

  hasStarterSquad: (): boolean => {
    try {
      return localStorage.getItem(STARTER_KEY) === '1';
    } catch {
      return false;
    }
  },

  markStarterSquadGranted: (): void => {
    try {
      localStorage.setItem(STARTER_KEY, '1');
    } catch (error) {
      console.error('Failed to record starter squad grant:', error);
    }
  },

  clear: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STARTER_KEY);
    } catch (error) {
      console.error('Failed to clear campaign progress:', error);
    }
  },
};
