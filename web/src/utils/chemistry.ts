/**
 * Nationality chemistry (Phase 2b, item 6 of the roadmap — first thing cut
 * if the core loop isn't landing, but the loop needs the sink chemistry
 * provides: without it, "field the 11 best individual cards" is always the
 * right answer, which is a duller squad-building puzzle than picking a
 * nation and going deep on it. 10 of the 42 countries in the data field
 * enough players (11+) for a full national XI — see the Phase 2b PR
 * description for the actual counts.
 *
 * This never touches packages/match-engine/: it produces a plain
 * rating-point bonus per player id, applied at the same app-side seam as
 * card levels (services/api.ts's toEngineTeam). The engine only ever sees
 * the resulting number.
 */
import { Player } from '../types';

/** Rating points added per teammate sharing a nationality, beyond the first. */
export const CHEMISTRY_BONUS_PER_TEAMMATE = 0.4;
/**
 * Cap per player. Small relative to RESPONSE_KNEE (8.5) and tiny relative to
 * RATING_SCALE_WIDE (96) in engine.ts's BALANCE section — chemistry nudges a
 * fixture, it doesn't re-decide it, and it never needed the calibration
 * suite retuned.
 */
export const CHEMISTRY_MAX_BONUS = 4;

/**
 * Computes a per-player rating bonus from how many of their XI teammates
 * share their nationality. A player with no recorded nationality (shouldn't
 * happen in the shipped dataset, but the field is optional) contributes to
 * no one's count and receives no bonus itself.
 */
export function computeChemistryBonuses(
  squad: Array<{ id: string; nationality?: string }>
): Record<string, number> {
  const counts = new Map<string, number>();
  for (const p of squad) {
    if (!p.nationality) continue;
    counts.set(p.nationality, (counts.get(p.nationality) ?? 0) + 1);
  }

  const bonuses: Record<string, number> = {};
  for (const p of squad) {
    if (!p.nationality) continue;
    const teammates = (counts.get(p.nationality) ?? 1) - 1;
    bonuses[p.id] = Math.min(CHEMISTRY_MAX_BONUS, CHEMISTRY_BONUS_PER_TEAMMATE * teammates);
  }
  return bonuses;
}

/** Groups a squad by nationality, largest first — for the "who's boosted" UI. */
export function groupByNationality(squad: Player[]): Array<{ nationality: string; players: Player[] }> {
  const groups = new Map<string, Player[]>();
  for (const p of squad) {
    if (!p.nationality) continue;
    const list = groups.get(p.nationality) ?? [];
    list.push(p);
    groups.set(p.nationality, list);
  }
  return [...groups.entries()]
    .map(([nationality, players]) => ({ nationality, players }))
    .sort((a, b) => b.players.length - a.players.length);
}
