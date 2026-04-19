import { Club, Team, Player } from '../types';

interface RawTeam {
  id: string;
  clubId: string;
  name: string;
  year: number;
  season?: string;
  description?: string;
  players: Player[];
}

interface RawClub {
  id: string;
  name: string;
  shortName: string;
  description?: string;
}

interface RawData {
  clubs: RawClub[];
  teams: RawTeam[];
}

/**
 * Deduplicates players across multiple teams/eras
 * Returns unique players with best ratings and era appearances
 */
function deduplicateAndAggregatePlayers(teams: RawTeam[]): Player[] {
  const playerMap = new Map<string, Player & { appearances: Set<number> }>();

  teams.forEach(team => {
    team.players.forEach(player => {
      // Create a key from name and position (as deduplication criteria)
      const key = `${player.name.toLowerCase()}|${player.position}`;

      if (playerMap.has(key)) {
        const existing = playerMap.get(key)!;
        // Keep the player with higher rating
        if (player.overallRating > existing.overallRating) {
          existing.overallRating = player.overallRating;
          existing.attackRating = Math.max(existing.attackRating, player.attackRating);
          existing.defenceRating = Math.max(existing.defenceRating, player.defenceRating);
          existing.stamina = Math.max(existing.stamina, player.stamina);
        }
        existing.appearances.add(team.year);
      } else {
        playerMap.set(key, {
          ...player,
          appearances: new Set([team.year]),
          eraAppearances: [] // Will fill below
        });
      }
    });
  });

  // Convert back to array with eraAppearances filled and era info added to name
  return Array.from(playerMap.values()).map(p => {
    const sortedYears = Array.from(p.appearances).sort();
    const eraInfo = sortedYears.length > 1
      ? sortedYears.join('/')
      : sortedYears[0].toString();

    return {
      ...p,
      name: `${p.name} (${eraInfo})`,
      eraAppearances: sortedYears
    };
  });
}

/**
 * Processes raw data and creates Club objects with aggregated all-time players
 */
export function processTeamsData(rawData: RawData): { clubs: Club[], teams: Team[] } {
  const teamsMap = new Map<string, RawTeam[]>();

  // Group teams by club
  rawData.teams.forEach(team => {
    if (!teamsMap.has(team.clubId)) {
      teamsMap.set(team.clubId, []);
    }
    teamsMap.get(team.clubId)!.push(team);
  });

  // Create Club objects with all-time players
  const clubs = rawData.clubs.map(rawClub => {
    const clubTeams = teamsMap.get(rawClub.id) || [];
    const allTimePlayers = deduplicateAndAggregatePlayers(clubTeams);

    return {
      id: rawClub.id,
      name: rawClub.name,
      shortName: rawClub.shortName,
      description: rawClub.description,
      allTimePlayers
    } as Club;
  });

  return {
    clubs,
    teams: rawData.teams
  };
}

/**
 * Mock data fetcher - in production this would call the API
 */
export async function loadTeamsData(): Promise<{ clubs: Club[], teams: Team[] }> {
  try {
    const response = await fetch('/teams-data.json');
    const rawData: RawData = await response.json();
    return processTeamsData(rawData);
  } catch (error) {
    console.error('Failed to load teams data:', error);
    return { clubs: [], teams: [] };
  }
}
