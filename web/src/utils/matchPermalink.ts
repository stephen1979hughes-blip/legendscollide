/**
 * The /m/<teamA>-v-<teamB>/<seed> permalink format.
 *
 * Pure, framework-free on purpose: this file is imported both by the React
 * app (web/src/) and by the Cloudflare Pages Function that injects per-match
 * OG tags (functions/m/[matchup]/[seed].ts), which runs in the Workers
 * runtime, not Vite. No Node/DOM/React APIs here.
 *
 * Team ids are slugs like "man-utd-1968" — none contain the literal
 * substring "-v-" in the current dataset, which is what makes splitting on
 * it unambiguous. Custom XI ids (from web/src/pages/CustomXIBuilder.tsx) are
 * prefixed "custom-xi-" and deliberately not resolvable through this format;
 * see isPermalinkEligible.
 */

const SEPARATOR = '-v-';

export interface MatchupParts {
  teamAId: string;
  teamBId: string;
}

/** Base36 keeps the seed short and URL-friendly (a uint32 is at most 7 chars). */
export function encodeSeed(seed: number): string {
  return (seed >>> 0).toString(36);
}

/** Returns null for anything that isn't a valid encoded uint32 seed. */
export function decodeSeed(encoded: string): number | null {
  if (!/^[0-9a-z]+$/i.test(encoded)) return null;
  const n = parseInt(encoded, 36);
  if (!Number.isFinite(n) || n < 0 || n > 0xffffffff) return null;
  return n >>> 0;
}

export function parseMatchup(matchup: string): MatchupParts | null {
  const idx = matchup.indexOf(SEPARATOR);
  if (idx <= 0) return null;
  const teamAId = matchup.slice(0, idx);
  const teamBId = matchup.slice(idx + SEPARATOR.length);
  if (!teamAId || !teamBId) return null;
  return { teamAId, teamBId };
}

export function buildMatchPermalinkPath(teamAId: string, teamBId: string, seed: number): string {
  return `/m/${teamAId}${SEPARATOR}${teamBId}/${encodeSeed(seed)}`;
}

/** Custom XIs aren't derivable from an id alone, so they're excluded from permalinks. */
export function isPermalinkEligible(teamAId: string, teamBId: string): boolean {
  return !teamAId.startsWith('custom-xi-') && !teamBId.startsWith('custom-xi-');
}
