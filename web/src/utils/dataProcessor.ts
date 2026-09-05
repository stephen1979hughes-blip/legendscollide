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
  bio?: string;
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
 * Creates Club objects for actual clubs and each country with all unique players (no year suffixes)
 * Creates Team objects for each classic team
 */
export function processTeamsData(rawData: NormalizedData): { clubs: Club[], teams: Team[], players: Player[] } {
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

  const clubs: Club[] = [];

  // Create Club objects for actual clubs (with explicit rosters)
  const actualClubs = rawData.clubs || [];
  actualClubs.forEach(club => {
    let allTimePlayers: Player[] = [];

    // If club has a roster, use that; otherwise use all players from country
    if ((club as any).roster && Array.isArray((club as any).roster)) {
      allTimePlayers = (club as any).roster
        .map((playerId: string) => {
          const player = playersById.get(playerId);
          return player ? {
            id: player.id,
            name: player.name,
            nationality: player.countryId,
            position: player.position as 'GK' | 'DF' | 'MF' | 'FW',
            overallRating: player.overallRating,
            attackRating: player.attackRating,
            defenceRating: player.defenceRating,
            stamina: player.stamina,
            bio: player.bio,
            eraAppearances: []
          } : null;
        })
        .filter((p: any): p is Player => p !== null)
        .sort((a: Player, b: Player) => a.name.localeCompare(b.name));
    } else {
      const clubPlayers = club.countryId ? playersByCountry.get(club.countryId) || [] : [];
      allTimePlayers = clubPlayers
        .map(p => ({
          id: p.id,
          name: p.name,
          nationality: p.countryId,
          position: p.position as 'GK' | 'DF' | 'MF' | 'FW',
          overallRating: p.overallRating,
          attackRating: p.attackRating,
          defenceRating: p.defenceRating,
          stamina: p.stamina,
          bio: p.bio,
          eraAppearances: []
        }))
        .sort((a: Player, b: Player) => a.name.localeCompare(b.name));
    }

    clubs.push({
      id: club.id,
      name: club.name,
      shortName: club.shortName,
      description: `${club.name} players`,
      allTimePlayers
    } as Club);
  });

  // Create Club objects for each country with all-time players
  const countries = rawData.countries || [];
  countries.forEach(country => {
    const countryPlayers = playersByCountry.get(country.id) || [];
    const allTimePlayers: Player[] = countryPlayers
      .map(p => ({
        id: p.id,
        name: p.name, // No year suffix - these are unique player names!
        nationality: p.countryId,
        position: p.position as 'GK' | 'DF' | 'MF' | 'FW',
        overallRating: p.overallRating,
        attackRating: p.attackRating,
        defenceRating: p.defenceRating,
        stamina: p.stamina,
        bio: p.bio,
        eraAppearances: []
      }))
      .sort((a: Player, b: Player) => a.name.localeCompare(b.name));

    clubs.push({
      id: country.id,
      name: country.name,
      shortName: country.code,
      description: `All ${country.name} players`,
      allTimePlayers
    } as Club);
  });

  // Sort all clubs alphabetically
  clubs.sort((a, b) => a.name.localeCompare(b.name));

  // Create Team objects from classic teams
  const teams: Team[] = rawData.classicTeams.map(classicTeam => {
    const teamPlayers = classicTeam.players.map(tp => {
      const player = playersById.get(tp.playerId);
      return {
        id: tp.playerId,
        name: player?.name || 'Unknown',
        nationality: player?.countryId || '',
        position: (tp.position || player?.position || 'MF') as 'GK' | 'DF' | 'MF' | 'FW',
        overallRating: player?.overallRating || 0,
        attackRating: player?.attackRating || 0,
        defenceRating: player?.defenceRating || 0,
        stamina: player?.stamina || 0,
        bio: player?.bio,
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

  // Flat, deduplicated player pool — the 414-player source of truth for
  // anything that needs every player exactly once (pack odds, the collection
  // browser), as opposed to `clubs`, which repeats a player once per
  // club/country grouping they belong to.
  const allPlayers: Player[] = rawData.players
    .map((p) => ({
      id: p.id,
      name: p.name,
      nationality: p.countryId,
      position: p.position as 'GK' | 'DF' | 'MF' | 'FW',
      overallRating: p.overallRating,
      attackRating: p.attackRating,
      defenceRating: p.defenceRating,
      stamina: p.stamina,
      bio: p.bio,
      eraAppearances: []
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return { clubs, teams, players: allPlayers };
}

/**
 * Loads teams data from normalized JSON file (no year suffixes in player names)
 */
export async function loadTeamsData(): Promise<{ clubs: Club[], teams: Team[], players: Player[] }> {
  try {
    const response = await fetch('/teams-data-normalized.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const rawData: NormalizedData = await response.json();
    return processTeamsData(rawData);
  } catch (error) {
    console.error('Failed to load teams data:', error);
    return { clubs: [], teams: [], players: [] };
  }
}
