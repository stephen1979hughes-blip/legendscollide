import { Team, TeamSummary, MatchResult } from '../types';
import { simulateRealisticMatch } from './matchEngine';

const API_BASE = 'http://localhost:7071/api';

// Simple in-memory cache so we don't re-fetch the same team repeatedly
const teamCache = new Map<string, Team>();

export const api = {
  async getTeams(): Promise<TeamSummary[]> {
    const response = await fetch(`${API_BASE}/teams`);
    if (!response.ok) throw new Error(`Failed to load teams: ${response.status}`);
    const data: Array<{ id: string; name: string; year: number; playerCount: number }> = await response.json();
    return data.map(t => ({
      id: t.id,
      name: t.name,
      clubId: '',   // backend doesn't expose clubId — only needed by CustomXI which uses dataProcessor.ts
      year: t.year,
      playerCount: t.playerCount
    }));
  },

  async getTeam(id: string): Promise<Team> {
    if (teamCache.has(id)) return teamCache.get(id)!;

    const response = await fetch(`${API_BASE}/teams/${id}`);
    if (!response.ok) throw new Error(`Team ${id} not found`);
    const data = await response.json();

    const team: Team = {
      id: data.id,
      name: data.name,
      clubId: '',
      year: data.year,
      players: (data.players ?? []).map((p: any) => ({
        id: p.id,
        name: p.name,
        position: p.position,
        overallRating: p.overallRating,
        attackRating: p.attackRating,
        defenceRating: p.defenceRating,
        stamina: p.stamina,
      }))
    };

    teamCache.set(id, team);
    return team;
  },

  async simulateMatch(
    teamAId: string,
    teamBId: string,
    normaliseEra: boolean = false,
    customTeamA?: Team,
    customTeamB?: Team
  ): Promise<MatchResult> {
    let teamA: Team;
    let teamB: Team;

    if (customTeamA && customTeamB) {
      teamA = customTeamA;
      teamB = customTeamB;
    } else {
      [teamA, teamB] = await Promise.all([
        this.getTeam(teamAId),
        this.getTeam(teamBId)
      ]);
    }

    return simulateRealisticMatch(teamAId, teamBId, teamA, teamB);
  },

  async simulateMatchWithAI(
    teamAId: string,
    teamBId: string
  ): Promise<MatchResult> {
    const response = await fetch(`${API_BASE}/simulateAi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamAId, teamBId })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'AI simulation failed');
    }

    return response.json();
  }
};
