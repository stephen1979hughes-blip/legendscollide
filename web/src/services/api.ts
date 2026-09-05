import { Team, TeamSummary, MatchResult, Player, Club } from '../types';
import { loadTeamsData, CountryRef } from '../utils/dataProcessor';
import { defaultEngine, randomSeed, type EngineTeam } from '@fm/match-engine';
import { effectiveRating, MAX_CARD_LEVEL } from '../utils/cardProgression';

/**
 * Data access for the app.
 *
 * Everything is served from public/teams-data-normalized.json — the single
 * source of truth — and simulated in-process by @fm/match-engine. There is no
 * backend: the Azure Functions app that used to serve /api/teams was removed
 * once its data was merged into the normalized file.
 *
 * The admin editor is the one exception; it talks to the local Express server
 * in api/ (see services/adminApi.ts) because it needs to write to disk.
 */

let cache: Promise<{ teams: Team[]; players: Player[]; clubs: Club[]; countries: CountryRef[] }> | null = null;

function store() {
  cache ??= loadTeamsData().then(({ teams, players, clubs, countries }) => ({ teams, players, clubs, countries }));
  return cache;
}

/** Drops the in-memory cache; used by the admin editor after it saves. */
export function invalidateTeamsCache() {
  cache = null;
}

/**
 * Adapt the app's Team to the engine's input shape.
 *
 * `cardLevels` is how card progression (see utils/cardProgression.ts) reaches
 * the engine without the engine ever knowing levels exist: each player's true
 * rating is resolved to an effective rating right here, at the call site, and
 * only the plain number crosses into EngineTeam. A player missing from the
 * map (or the map itself being omitted, as for every classic-team opponent)
 * plays at full rating — MAX_CARD_LEVEL is just `effectiveRating`'s identity
 * level, not a special case.
 *
 * `chemistryBonus` is the Phase 2b nationality-chemistry seam (see
 * utils/chemistry.ts): a flat rating-point addition per player id, applied
 * after `effectiveRating` and clamped back into range. Like card levels,
 * chemistry never crosses into EngineTeam as anything but a plain number —
 * the engine has no idea a squad shares a nationality.
 */
function toEngineTeam(
  team: Team,
  cardLevels?: Record<string, number>,
  chemistryBonus?: Record<string, number>
): EngineTeam {
  return {
    id: team.id,
    name: team.name,
    players: team.players.map((p) => {
      const level = cardLevels?.[p.id] ?? MAX_CARD_LEVEL;
      const bonus = chemistryBonus?.[p.id] ?? 0;
      const withChemistry = (rating: number) =>
        Math.max(1, Math.min(99, effectiveRating(rating, level) + bonus));
      return {
        id: p.id,
        name: p.name,
        position: p.position,
        overallRating: withChemistry(p.overallRating),
        attackRating: withChemistry(p.attackRating),
        defenceRating: withChemistry(p.defenceRating),
        stamina: p.stamina,
      };
    }),
  };
}

export const api = {
  async getTeams(): Promise<TeamSummary[]> {
    const { teams } = await store();
    return teams
      .map((t) => ({
        id: t.id,
        name: t.name,
        clubId: t.clubId,
        year: t.year,
        playerCount: t.players.length,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  async getTeam(id: string): Promise<Team> {
    const { teams } = await store();
    const team = teams.find((t) => t.id === id);
    if (!team) throw new Error(`Team ${id} not found`);
    return team;
  },

  /**
   * The flat, deduplicated 414-player pool — one entry per player regardless
   * of how many clubs/countries they'd otherwise appear under. This is the
   * source of truth for pack odds and the collection browser.
   */
  async getAllPlayers(): Promise<Player[]> {
    const { players } = await store();
    return players;
  },

  /** Every club and country-as-a-squad entry — trivia's source for "which club or nation fielded this team". */
  async getClubs(): Promise<Club[]> {
    const { clubs } = await store();
    return clubs;
  },

  /** Real nations only — trivia's source for "what's this player's nationality". */
  async getCountries(): Promise<CountryRef[]> {
    const { countries } = await store();
    return countries;
  },

  /**
   * Simulate a match. `seed` is optional — pass one to reproduce a previous
   * result exactly, omit it for a fresh match.
   *
   * The engine's own MatchResult has no seed field (it's the swap point for
   * a future Rust/WASM implementation, and the seed is an input the engine
   * receives rather than something it needs to report back). The resolved
   * seed — whatever was passed in, or freshly drawn by the default above —
   * is known right here at the call site, so it's attached to the result
   * here rather than threading a new field through the engine's contract.
   * This is what makes a match permalink possible: /m/<a>-v-<b>/<seed>
   * reconstructs the exact result by replaying this same call.
   *
   * `teamACardLevels` resolves team A's collection into effective ratings
   * (see toEngineTeam above) — a player id missing from the map plays at
   * full rating, so passing nothing here is the same as everyone being
   * maxed. Team B has no equivalent parameter: it is always a classic-team
   * opponent, and those always play at full rating.
   *
   * `teamAChemistryBonus` is the campaign squad's nationality-chemistry
   * adjustment (utils/chemistry.ts) — again team A only, since it only ever
   * applies to a collection-sourced XI.
   */
  async simulateMatch(
    teamAId: string,
    teamBId: string,
    _normaliseEra: boolean = false,
    customTeamA?: Team,
    customTeamB?: Team,
    seed: number = randomSeed(),
    teamACardLevels?: Record<string, number>,
    teamAChemistryBonus?: Record<string, number>
  ): Promise<MatchResult> {
    const teamA = customTeamA ?? (await this.getTeam(teamAId));
    const teamB = customTeamB ?? (await this.getTeam(teamBId));

    const result = defaultEngine.simulate({
      teamA: toEngineTeam(teamA, teamACardLevels, teamAChemistryBonus),
      teamB: toEngineTeam(teamB),
      seed,
    });

    return { ...result, seed };
  },
};
