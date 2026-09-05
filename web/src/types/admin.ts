export interface AdminPlayerForm {
  id: string;
  name: string;
  position: 'GK' | 'DF' | 'MF' | 'FW';
  overallRating: number;
  attackRating: number;
  defenceRating: number;
  stamina: number;
  countryId: string;
  clubs?: string[];
  classicTeams?: string[];
}

export interface AdminClubForm {
  id: string;
  name: string;
  shortName: string;
  countryId: string;
  roster: string[];
}

export interface AdminCountryForm {
  id: string;
  name: string;
  code: string;
}

export interface AdminClassicTeamForm {
  id: string;
  name: string;
  countryId: string;
  year: number;
  season?: string;
  description?: string;
  players: Array<{
    playerId: string;
    position: string;
  }>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  /** Non-blocking — things worth a second look (e.g. a lopsided formation flank) rather than broken references. */
  warnings: string[];
}

export interface NormalizedData {
  countries: Array<{ id: string; name: string; code: string }>;
  clubs: Array<{ id: string; name: string; shortName: string; countryId: string; roster?: string[] }>;
  players: Array<{
    id: string;
    name: string;
    position: string;
    overallRating: number;
    attackRating: number;
    defenceRating: number;
    stamina: number;
    countryId: string;
  }>;
  classicTeams: Array<{
    id: string;
    name: string;
    countryId: string;
    year: number;
    season?: string;
    description?: string;
    players: Array<{ playerId: string; position: string }>;
  }>;
}
