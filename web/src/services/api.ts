import { Team, TeamSummary, MatchResult } from '../types';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:7071/api';

export const api = {
  async getTeams(): Promise<TeamSummary[]> {
    const response = await fetch(`${API_BASE}/teams`);
    if (!response.ok) throw new Error('Failed to fetch teams');
    return response.json();
  },

  async getTeam(id: string): Promise<Team> {
    const response = await fetch(`${API_BASE}/teams/${id}`);
    if (!response.ok) throw new Error('Failed to fetch team');
    return response.json();
  },

  async simulateMatch(
    teamAId: string,
    teamBId: string,
    normaliseEra: boolean = false
  ): Promise<MatchResult> {
    const response = await fetch(`${API_BASE}/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamAId, teamBId, normaliseEra })
    });
    if (!response.ok) throw new Error('Failed to simulate match');
    return response.json();
  }
};
