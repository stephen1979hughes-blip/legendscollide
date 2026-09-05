/**
 * Coarse position categories, mirroring `getPositionCategory` in
 * packages/match-engine/src/engine.ts. Duplicated deliberately rather than
 * imported — it's small domain logic, and CLAUDE.md already treats the app
 * and engine types as intentionally separate. Used app-side wherever we need
 * to guarantee squad-building coverage (the starter squad, pack previews)
 * without depending on the engine's internals.
 */
export type CoarsePosition = 'GK' | 'DF' | 'MF' | 'FW';

export function coarsePosition(position: string): CoarsePosition {
  const p = position.toUpperCase();
  if (p === 'GK') return 'GK';
  if (['DF', 'CB', 'RB', 'LB', 'RWB', 'LWB'].includes(p)) return 'DF';
  if (['MF', 'CM', 'RM', 'LM', 'CDM', 'CAM'].includes(p)) return 'MF';
  if (['FW', 'ST', 'CF', 'LW', 'RW'].includes(p)) return 'FW';
  return 'MF';
}
