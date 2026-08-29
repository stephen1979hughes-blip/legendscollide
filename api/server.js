const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Path to data file
const DATA_FILE = path.join(__dirname, '../web/public/teams-data-normalized.json');

// Utility: Load data from JSON file
function loadData() {
  try {
    const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Error loading data:', error);
    return null;
  }
}

// Utility: Save data to JSON file
function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving data:', error);
    return false;
  }
}

// Utility: Validate data integrity
function validateData(data) {
  const errors = [];

  // Check for duplicate player IDs
  const playerIds = new Set();
  data.players.forEach(p => {
    if (playerIds.has(p.id)) {
      errors.push(`Duplicate player ID: ${p.id}`);
    }
    playerIds.add(p.id);
  });

  // Check for duplicate club IDs
  const clubIds = new Set();
  data.clubs.forEach(c => {
    if (clubIds.has(c.id)) {
      errors.push(`Duplicate club ID: ${c.id}`);
    }
    clubIds.add(c.id);

    // Check club roster players exist
    if (c.roster && Array.isArray(c.roster)) {
      c.roster.forEach(playerId => {
        if (!playerIds.has(playerId)) {
          errors.push(`Club ${c.id} references non-existent player: ${playerId}`);
        }
      });
    }
  });

  // Check for duplicate country IDs
  const countryIds = new Set();
  data.countries.forEach(c => {
    if (countryIds.has(c.id)) {
      errors.push(`Duplicate country ID: ${c.id}`);
    }
    countryIds.add(c.id);
  });

  // Check classic teams reference valid players
  data.classicTeams.forEach(team => {
    team.players.forEach(tp => {
      if (!playerIds.has(tp.playerId)) {
        errors.push(`Classic team ${team.id} references non-existent player: ${tp.playerId}`);
      }
    });
  });

  // Check required fields
  data.players.forEach(p => {
    if (!p.id || !p.name || !p.position || p.overallRating === undefined) {
      errors.push(`Player ${p.id || 'unknown'} missing required fields`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

// ========== ADMIN ROUTES ==========

// GET /api/admin/data - Get all data
app.get('/api/admin/data', (req, res) => {
  const data = loadData();
  if (!data) {
    return res.status(500).json({ error: 'Failed to load data' });
  }

  // Enrich players with their club and classic team associations
  const enrichedPlayers = data.players.map(player => {
    // Find all clubs that include this player
    const clubs = data.clubs
      .filter(club => club.roster && club.roster.includes(player.id))
      .map(club => club.id);

    // Find all classic teams that include this player
    const classicTeams = data.classicTeams
      .filter(team => team.players && team.players.some(p => p.playerId === player.id))
      .map(team => team.id);

    return {
      ...player,
      clubs: clubs.length > 0 ? clubs : (player.clubs || []),
      classicTeams: classicTeams.length > 0 ? classicTeams : (player.classicTeams || [])
    };
  });

  // Return data with enriched players
  res.json({
    ...data,
    players: enrichedPlayers
  });
});

// ========== PLAYER ROUTES ==========

// POST /api/admin/players - Create player
app.post('/api/admin/players', (req, res) => {
  const data = loadData();
  if (!data) return res.status(500).json({ error: 'Failed to load data' });

  console.log('[POST /api/admin/players] Request body:', JSON.stringify(req.body, null, 2));

  const { id, name, position, overallRating, attackRating, defenceRating, stamina, countryId, clubs, classicTeams } = req.body;
  console.log('[POST /api/admin/players] clubs extracted:', clubs);

  // Validation
  if (!id || !name || !position || overallRating === undefined) {
    return res.status(400).json({ error: 'Missing required fields: id, name, position, overallRating' });
  }

  if (data.players.some(p => p.id === id)) {
    return res.status(400).json({ error: `Player with ID '${id}' already exists` });
  }

  const newPlayer = {
    id,
    name,
    position,
    overallRating,
    attackRating: attackRating || 0,
    defenceRating: defenceRating || 0,
    stamina: stamina || 0,
    countryId: countryId || '',
    clubs: clubs || [],
    classicTeams: classicTeams || []
  };
  data.players.push(newPlayer);

  // Sync clubs - add player to selected clubs' rosters
  if (clubs && Array.isArray(clubs)) {
    clubs.forEach(clubId => {
      const club = data.clubs.find(c => c.id === clubId);
      if (club && !club.roster.includes(id)) {
        club.roster.push(id);
      }
    });
  }

  // Sync classic teams - add player to selected teams
  if (classicTeams && Array.isArray(classicTeams)) {
    classicTeams.forEach(teamId => {
      const team = data.classicTeams.find(t => t.id === teamId);
      if (team && !team.players.some(p => p.playerId === id)) {
        team.players.push({ playerId: id, position: position });
      }
    });
  }

  if (!saveData(data)) {
    return res.status(500).json({ error: 'Failed to save data' });
  }

  res.status(201).json(newPlayer);
});

// PUT /api/admin/players/:id - Update player
app.put('/api/admin/players/:id', (req, res) => {
  const data = loadData();
  if (!data) return res.status(500).json({ error: 'Failed to load data' });

  const player = data.players.find(p => p.id === req.params.id);
  if (!player) {
    return res.status(404).json({ error: 'Player not found' });
  }

  const { name, position, overallRating, attackRating, defenceRating, stamina, countryId, clubs, classicTeams } = req.body;

  if (name) player.name = name;
  if (position) player.position = position;
  if (overallRating !== undefined) player.overallRating = overallRating;
  if (attackRating !== undefined) player.attackRating = attackRating;
  if (defenceRating !== undefined) player.defenceRating = defenceRating;
  if (stamina !== undefined) player.stamina = stamina;
  if (countryId) player.countryId = countryId;

  // Handle club associations
  if (clubs !== undefined && Array.isArray(clubs)) {
    const oldClubs = player.clubs || [];
    const playerId = req.params.id;

    // Remove player from clubs no longer in the list
    oldClubs.forEach(clubId => {
      if (!clubs.includes(clubId)) {
        const club = data.clubs.find(c => c.id === clubId);
        if (club) {
          club.roster = club.roster.filter(p => p !== playerId);
        }
      }
    });

    // Add player to clubs newly in the list
    clubs.forEach(clubId => {
      if (!oldClubs.includes(clubId)) {
        const club = data.clubs.find(c => c.id === clubId);
        if (club && !club.roster.includes(playerId)) {
          club.roster.push(playerId);
        }
      }
    });

    player.clubs = clubs;
  }

  // Handle classic team associations
  if (classicTeams !== undefined && Array.isArray(classicTeams)) {
    const oldTeams = player.classicTeams || [];
    const playerId = req.params.id;

    // Remove player from teams no longer in the list
    oldTeams.forEach(teamId => {
      if (!classicTeams.includes(teamId)) {
        const team = data.classicTeams.find(t => t.id === teamId);
        if (team) {
          team.players = team.players.filter(p => p.playerId !== playerId);
        }
      }
    });

    // Add player to teams newly in the list
    classicTeams.forEach(teamId => {
      if (!oldTeams.includes(teamId)) {
        const team = data.classicTeams.find(t => t.id === teamId);
        if (team && !team.players.some(p => p.playerId === playerId)) {
          team.players.push({ playerId: playerId, position: player.position });
        }
      }
    });

    player.classicTeams = classicTeams;
  }

  if (!saveData(data)) {
    return res.status(500).json({ error: 'Failed to save data' });
  }

  res.json(player);
});

// DELETE /api/admin/players/:id - Delete player
app.delete('/api/admin/players/:id', (req, res) => {
  const data = loadData();
  if (!data) return res.status(500).json({ error: 'Failed to load data' });

  const index = data.players.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Player not found' });
  }

  const playerId = req.params.id;

  // Remove player from all club rosters
  data.clubs.forEach(club => {
    club.roster = club.roster.filter(p => p !== playerId);
  });

  // Remove player from all classic team rosters
  data.classicTeams.forEach(team => {
    team.players = team.players.filter(p => p.playerId !== playerId);
  });

  data.players.splice(index, 1);

  if (!saveData(data)) {
    return res.status(500).json({ error: 'Failed to save data' });
  }

  res.status(204).send();
});

// ========== CLUB ROUTES ==========

// POST /api/admin/clubs - Create club
app.post('/api/admin/clubs', (req, res) => {
  const data = loadData();
  if (!data) return res.status(500).json({ error: 'Failed to load data' });

  const { id, name, shortName, countryId, roster } = req.body;

  if (!id || !name || !shortName) {
    return res.status(400).json({ error: 'Missing required fields: id, name, shortName' });
  }

  if (data.clubs.some(c => c.id === id)) {
    return res.status(400).json({ error: `Club with ID '${id}' already exists` });
  }

  const newClub = { id, name, shortName, countryId: countryId || '', roster: roster || [] };
  data.clubs.push(newClub);
  data.clubs.sort((a, b) => a.name.localeCompare(b.name));

  if (!saveData(data)) {
    return res.status(500).json({ error: 'Failed to save data' });
  }

  res.status(201).json(newClub);
});

// PUT /api/admin/clubs/:id - Update club
app.put('/api/admin/clubs/:id', (req, res) => {
  const data = loadData();
  if (!data) return res.status(500).json({ error: 'Failed to load data' });

  const club = data.clubs.find(c => c.id === req.params.id);
  if (!club) {
    return res.status(404).json({ error: 'Club not found' });
  }

  const { name, shortName, countryId, roster } = req.body;

  if (name) club.name = name;
  if (shortName) club.shortName = shortName;
  if (countryId !== undefined) club.countryId = countryId;
  if (Array.isArray(roster)) club.roster = roster;

  if (!saveData(data)) {
    return res.status(500).json({ error: 'Failed to save data' });
  }

  res.json(club);
});

// DELETE /api/admin/clubs/:id - Delete club
app.delete('/api/admin/clubs/:id', (req, res) => {
  const data = loadData();
  if (!data) return res.status(500).json({ error: 'Failed to load data' });

  const index = data.clubs.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Club not found' });
  }

  data.clubs.splice(index, 1);

  if (!saveData(data)) {
    return res.status(500).json({ error: 'Failed to save data' });
  }

  res.status(204).send();
});

// ========== COUNTRY ROUTES ==========

// POST /api/admin/countries - Create country
app.post('/api/admin/countries', (req, res) => {
  const data = loadData();
  if (!data) return res.status(500).json({ error: 'Failed to load data' });

  const { id, name, code } = req.body;

  if (!id || !name || !code) {
    return res.status(400).json({ error: 'Missing required fields: id, name, code' });
  }

  if (data.countries.some(c => c.id === id)) {
    return res.status(400).json({ error: `Country with ID '${id}' already exists` });
  }

  const newCountry = { id, name, code };
  data.countries.push(newCountry);
  data.countries.sort((a, b) => a.name.localeCompare(b.name));

  if (!saveData(data)) {
    return res.status(500).json({ error: 'Failed to save data' });
  }

  res.status(201).json(newCountry);
});

// PUT /api/admin/countries/:id - Update country
app.put('/api/admin/countries/:id', (req, res) => {
  const data = loadData();
  if (!data) return res.status(500).json({ error: 'Failed to load data' });

  const country = data.countries.find(c => c.id === req.params.id);
  if (!country) {
    return res.status(404).json({ error: 'Country not found' });
  }

  const { name, code } = req.body;

  if (name) country.name = name;
  if (code) country.code = code;

  if (!saveData(data)) {
    return res.status(500).json({ error: 'Failed to save data' });
  }

  res.json(country);
});

// DELETE /api/admin/countries/:id - Delete country
app.delete('/api/admin/countries/:id', (req, res) => {
  const data = loadData();
  if (!data) return res.status(500).json({ error: 'Failed to load data' });

  const index = data.countries.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Country not found' });
  }

  data.countries.splice(index, 1);

  if (!saveData(data)) {
    return res.status(500).json({ error: 'Failed to save data' });
  }

  res.status(204).send();
});

// ========== CLASSIC TEAM ROUTES ==========

// POST /api/admin/classic-teams - Create classic team
app.post('/api/admin/classic-teams', (req, res) => {
  const data = loadData();
  if (!data) return res.status(500).json({ error: 'Failed to load data' });

  const { id, name, countryId, year, season, description, players } = req.body;

  if (!id || !name || !countryId || year === undefined) {
    return res.status(400).json({ error: 'Missing required fields: id, name, countryId, year' });
  }

  if (data.classicTeams.some(t => t.id === id)) {
    return res.status(400).json({ error: `Classic team with ID '${id}' already exists` });
  }

  const newTeam = { id, name, countryId, year, season: season || '', description: description || '', players: players || [] };
  data.classicTeams.push(newTeam);

  if (!saveData(data)) {
    return res.status(500).json({ error: 'Failed to save data' });
  }

  res.status(201).json(newTeam);
});

// PUT /api/admin/classic-teams/:id - Update classic team
app.put('/api/admin/classic-teams/:id', (req, res) => {
  const data = loadData();
  if (!data) return res.status(500).json({ error: 'Failed to load data' });

  const team = data.classicTeams.find(t => t.id === req.params.id);
  if (!team) {
    return res.status(404).json({ error: 'Classic team not found' });
  }

  const { name, countryId, year, season, description, players } = req.body;

  if (name) team.name = name;
  if (countryId) team.countryId = countryId;
  if (year !== undefined) team.year = year;
  if (season !== undefined) team.season = season;
  if (description !== undefined) team.description = description;
  if (Array.isArray(players)) team.players = players;

  if (!saveData(data)) {
    return res.status(500).json({ error: 'Failed to save data' });
  }

  res.json(team);
});

// DELETE /api/admin/classic-teams/:id - Delete classic team
app.delete('/api/admin/classic-teams/:id', (req, res) => {
  const data = loadData();
  if (!data) return res.status(500).json({ error: 'Failed to load data' });

  const index = data.classicTeams.findIndex(t => t.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Classic team not found' });
  }

  data.classicTeams.splice(index, 1);

  if (!saveData(data)) {
    return res.status(500).json({ error: 'Failed to save data' });
  }

  res.status(204).send();
});

// ========== VALIDATION & EXPORT ==========

// POST /api/admin/validate - Validate data integrity
app.post('/api/admin/validate', (req, res) => {
  const data = loadData();
  if (!data) return res.status(500).json({ error: 'Failed to load data' });

  const validation = validateData(data);
  res.json(validation);
});

// GET /api/admin/export - Export data as JSON
app.get('/api/admin/export', (req, res) => {
  const data = loadData();
  if (!data) return res.status(500).json({ error: 'Failed to load data' });

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="teams-data-normalized.json"');
  res.json(data);
});

// POST /api/admin/import - Import data from JSON
app.post('/api/admin/import', (req, res) => {
  const { data } = req.body;

  if (!data) {
    return res.status(400).json({ error: 'Missing data field' });
  }

  // Validate imported data
  const validation = validateData(data);
  if (!validation.valid) {
    return res.status(400).json({ error: 'Invalid data', details: validation.errors });
  }

  // Save the imported data
  if (!saveData(data)) {
    return res.status(500).json({ error: 'Failed to save imported data' });
  }

  res.json({ message: 'Data imported successfully', data });
});

// ========== HEALTH CHECK ==========

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Admin API is running' });
});

// ========== ERROR HANDLING ==========

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// ========== START SERVER ==========

app.listen(PORT, () => {
  console.log(`✓ Admin API server running on http://localhost:${PORT}`);
  console.log(`✓ Data file: ${DATA_FILE}`);
  console.log(`✓ Admin endpoints available at http://localhost:${PORT}/api/admin/*`);
});
