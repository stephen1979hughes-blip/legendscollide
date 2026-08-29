import { Team, TeamSummary, MatchResult } from '../types';
import { loadTeamsData } from '../utils/dataProcessor';
import { defaultEngine, randomSeed, type EngineTeam } from '@fm/match-engine';

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

let cache: Promise<{ teams: Team[] }> | null = null;

function store() {
  cache ??= loadTeamsData().then(({ teams }) => ({ teams }));
  return cache;
}

/** Drops the in-memory cache; used by the admin editor after it saves. */
export function invalidateTeamsCache() {
  cache = null;
}

/** Adapt the app's Team to the engine's input shape. */
function toEngineTeam(team: Team): EngineTeam {
  return {
    id: team.id,
    name: team.name,
    players: team.players.map((p) => ({
      id: p.id,
      name: p.name,
      position: p.position,
      overallRating: p.overallRating,
      attackRating: p.attackRating,
      defenceRating: p.defenceRating,
      stamina: p.stamina,
    })),
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
   * Simulate a match. `seed` is optional — pass one to reproduce a previous
   * result exactly, omit it for a fresh match.
   */
  async simulateMatch(
    teamAId: string,
    teamBId: string,
    _normaliseEra: boolean = false,
    customTeamA?: Team,
    customTeamB?: Team,
    seed: number = randomSeed()
  ): Promise<MatchResult> {
    const teamA = customTeamA ?? (await this.getTeam(teamAId));
    const teamB = customTeamB ?? (await this.getTeam(teamBId));

    return defaultEngine.simulate({
      teamA: toEngineTeam(teamA),
      teamB: toEngineTeam(teamB),
      seed,
    });
  },
};
