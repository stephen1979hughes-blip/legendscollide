const fs = require('fs');
const path = require('path');

// Nationality to country code mapping
const nationalityToCountry = {
  'English': 'england',
  'Scottish': 'scotland',
  'Welsh': 'wales',
  'Irish': 'ireland',
  'Northern Irish': 'northern-ireland',
  'Brazilian': 'brazil',
  'Argentine': 'argentina',
  'French': 'france',
  'Italian': 'italy',
  'German': 'germany',
  'Spanish': 'spain',
  'Danish': 'denmark',
  'Dutch': 'netherlands',
  'Portuguese': 'portugal',
  'Serbian': 'serbia',
};

const nationalityToCountryName = {
  'English': 'England',
  'Scottish': 'Scotland',
  'Welsh': 'Wales',
  'Irish': 'Ireland',
  'Northern Irish': 'Northern Ireland',
  'Brazilian': 'Brazil',
  'Argentine': 'Argentina',
  'French': 'France',
  'Italian': 'Italy',
  'German': 'Germany',
  'Spanish': 'Spain',
  'Danish': 'Denmark',
  'Dutch': 'Netherlands',
  'Portuguese': 'Portugal',
  'Serbian': 'Serbia',
};

// Read the current data
const inputPath = path.join(__dirname, '../public/teams-data.json');
const oldData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

// Extract unique countries
const countriesSet = new Set();
const countryMap = {}; // Map nationality names to country objects

oldData.teams.forEach(team => {
  team.players.forEach(player => {
    const nationality = player.nationality;
    const countryId = nationalityToCountry[nationality] || nationality.toLowerCase().replace(/\s+/g, '-');
    const countryName = nationalityToCountryName[nationality] || nationality;

    if (!countryMap[countryId]) {
      countryMap[countryId] = {
        id: countryId,
        name: countryName,
        code: countryId.substring(0, 2).toUpperCase()
      };
    }
    countriesSet.add(countryId);
  });
});

const countries = Object.values(countryMap).sort((a, b) => a.name.localeCompare(b.name));

// Extract unique clubs (separate from national teams)
const clubs = oldData.clubs
  .filter(club => !club.id.match(/^(england|france|brazil|argentina|italy|germany|spain)$/))
  .map(club => ({
    id: club.id,
    name: club.name,
    shortName: club.shortName,
    countryId: 'england', // Manchester United is English
    founded: 1878,
    city: 'Manchester'
  }));

// Extract unique national teams (from clubs list)
const nationalTeams = oldData.clubs
  .filter(club => club.id.match(/^(england|france|brazil|argentina|italy|germany|spain)$/))
  .map(club => ({
    id: club.id,
    name: club.name.replace(' National Team', ''),
    countryId: club.id,
    isNationalTeam: true
  }));

// Extract unique players (deduplicate by name/nationality combination)
const playersMap = {}; // key: "name-countryId"

oldData.teams.forEach(team => {
  team.players.forEach(player => {
    const nationality = player.nationality;
    const countryId = nationalityToCountry[nationality] || nationality.toLowerCase().replace(/\s+/g, '-');
    const playerKey = `${player.name.toLowerCase()}-${countryId}`;

    if (!playersMap[playerKey]) {
      playersMap[playerKey] = {
        id: player.id.replace(/-\d{4}$/, '').replace(/-\d+$/, ''), // Remove year suffixes
        name: player.name,
        countryId: countryId,
        position: player.position,
        overallRating: player.overallRating,
        attackRating: player.attackRating,
        defenceRating: player.defenceRating,
        stamina: player.stamina
      };
    }
  });
});

const players = Object.values(playersMap).sort((a, b) => a.name.localeCompare(b.name));

// Create classic teams (reference players by ID)
const classicTeams = oldData.teams.map(team => {
  const countryId = team.clubId;
  return {
    id: team.id,
    name: `${oldData.clubs.find(c => c.id === team.clubId).name.replace(' National Team', '')} ${team.year}`,
    countryId: countryId,
    year: team.year,
    season: team.season,
    description: team.description,
    players: team.players.map(player => {
      const nationality = player.nationality;
      const countryId = nationalityToCountry[nationality] || nationality.toLowerCase().replace(/\s+/g, '-');
      const playerKey = `${player.name.toLowerCase()}-${countryId}`;
      const actualPlayerId = playersMap[playerKey].id;
      return {
        playerId: actualPlayerId,
        position: player.position,
        number: null // Can be added later if needed
      };
    })
  };
});

// Create the normalized data structure
const normalizedData = {
  metadata: {
    version: '2.0',
    description: 'Normalized football data with relationships',
    lastUpdated: new Date().toISOString()
  },
  countries,
  clubs,
  nationalTeams,
  players,
  classicTeams
};

// Write the output
const outputPath = path.join(__dirname, '../public/teams-data-normalized.json');
fs.writeFileSync(outputPath, JSON.stringify(normalizedData, null, 2), 'utf8');

console.log('✓ Data normalization complete!');
console.log(`  Countries: ${countries.length}`);
console.log(`  Clubs: ${clubs.length}`);
console.log(`  National Teams: ${nationalTeams.length}`);
console.log(`  Unique Players: ${players.length}`);
console.log(`  Classic Teams: ${classicTeams.length}`);
console.log(`\nOutput: ${outputPath}`);

// Print sample of the structure
console.log('\n📊 Sample Structure:');
console.log('\nCountries:');
console.log(JSON.stringify(countries.slice(0, 3), null, 2));
console.log('\nPlayers (first 3):');
console.log(JSON.stringify(players.slice(0, 3), null, 2));
console.log('\nClassic Team (first one):');
console.log(JSON.stringify(classicTeams[0], null, 2));
