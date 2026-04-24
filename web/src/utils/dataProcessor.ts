import { Club, Team, Player } from '../types';

interface NormalizedCountry {
  id: string;
  name: string;
  code: string;
}

interface NormalizedPlayer {
  id: string;
  name: string;
  countryId: string;
  position: string;
  overallRating: number;
  attackRating: number;
  defenceRating: number;
  stamina: number;
}

interface NormalizedClassicTeam {
  id: string;
  name: string;
  countryId: string;
  year: number;
  season?: string;
  description?: string;
  players: Array<{
    playerId: string;
    position: string;
    number?: number;
  }>;
}

interface NormalizedClub {
  id: string;
  name: string;
  shortName: string;
  countryId?: string;
  founded?: number;
  city?: string;
}

interface NormalizedData {
  metadata?: any;
  countries: NormalizedCountry[];
  clubs: NormalizedClub[];
  nationalTeams?: any[];
  players: NormalizedPlayer[];
  classicTeams: NormalizedClassicTeam[];
}

/**
 * Processes normalized relational data
 * Creates Club objects per country with all unique players (no year suffixes)
 * Creates Team objects for each classic team
 */
export function processTeamsData(rawData: NormalizedData): { clubs: Club[], teams: Team[] } {
  // Create a map of players by ID for quick lookup
  const playersById = new Map<string, NormalizedPlayer>();
  rawData.players.forEach(p => {
    playersById.set(p.id, p);
  });

  // Group players by country
  const playersByCountry = new Map<string, NormalizedPlayer[]>();
  rawData.players.forEach(player => {
    if (!playersByCountry.has(player.countryId)) {
      playersByCountry.set(player.countryId, []);
    }
    playersByCountry.get(player.countryId)!.push(player);
  });

  // Create Club objects for each country with all-time players
  const countries = rawData.countries || [];
  const clubs: Club[] = countries
    .map(country => {
      const countryPlayers = playersByCountry.get(country.id) || [];
      const allTimePlayers: Player[] = countryPlayers
        .map(p => ({
          id: p.id,
          name: p.name, // No year suffix - these are unique player names!
          countryId: p.countryId,
          position: p.position,
          overallRating: p.overallRating,
          attackRating: p.attackRating,
          defenceRating: p.defenceRating,
          stamina: p.stamina,
          eraAppearances: []
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      return {
        id: country.id,
        name: country.name,
        shortName: country.code,
        description: `All ${country.name} players`,
        allTimePlayers
      } as Club;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  // Create Team objects from classic teams
  const teams: Team[] = rawData.classicTeams.map(classicTeam => {
    const teamPlayers = classicTeam.players.map(tp => {
      const player = playersById.get(tp.playerId);
      return {
        id: tp.playerId,
        name: player?.name || 'Unknown',
        countryId: player?.countryId || '',
        position: tp.position || player?.position || '',
        overallRating: player?.overallRating || 0,
        attackRating: player?.attackRating || 0,
        defenceRating: player?.defenceRating || 0,
        stamina: player?.stamina || 0,
        eraAppearances: []
      } as Player;
    });

    return {
      id: classicTeam.id,
      name: classicTeam.name,
      clubId: classicTeam.countryId,
      year: classicTeam.year,
      season: classicTeam.season,
      description: classicTeam.description,
      players: teamPlayers
    } as Team;
  });

  return { clubs, teams };
}

/**
 * Loads teams data from normalized JSON file (no year suffixes in player names)
 */
export async function loadTeamsData(): Promise<{ clubs: Club[], teams: Team[] }> {
  try {
    const response = await fetch('/teams-data-normalized.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const rawData: NormalizedData = await response.json();
    return processTeamsData(rawData);
  } catch (error) {
    console.error('Failed to load teams data:', error);
    return { clubs: [], teams: [] };
  }
}
