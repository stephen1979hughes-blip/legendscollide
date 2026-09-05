/**
 * The one-time free starter squad (Phase 2b): guarantees a new player can
 * field a full XI — and so play their first campaign match — before ever
 * earning or spending a token. "Start with nothing" means no purchases, not
 * an empty pitch.
 */
import { Player } from '../types';
import { cardCollectionStorage } from './cardCollectionStorage';
import { campaignStorage } from './campaignStorage';
import { openStarterSquad, PackPull } from './packs';

/** Grants the starter squad exactly once, ever. Returns the pulled cards if a grant just happened, otherwise null. */
export function ensureStarterSquad(pool: Player[]): PackPull[] | null {
  if (campaignStorage.hasStarterSquad()) return null;

  // Already has cards for some other reason (e.g. re-visiting after storage
  // was restored) — just mark the flag rather than granting a second squad.
  if (Object.keys(cardCollectionStorage.loadAll()).length > 0) {
    campaignStorage.markStarterSquadGranted();
    return null;
  }

  const granted = openStarterSquad(pool);
  campaignStorage.markStarterSquadGranted();
  return granted;
}
