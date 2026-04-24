# Data Structure Documentation

## Overview

The application now uses a **normalized relational data model** where each entity type is stored separately with proper relationships (instead of embedding data repetitively).

**Key Statistics:**
- 15 Countries
- 1 Club (Manchester United)
- 7 National Teams  
- 157 Unique Players (deduplicated)
- 16 Classic Teams (time-specific lineups)

## Data Model

### 1. **Countries** 
Single record per country with players' nationality

```json
{
  "id": "england",
  "name": "England",
  "code": "EN"
}
```

**Used for:**
- Grouping players by nationality
- Identifying national team rosters
- Filtering players in custom XI builder

---

### 2. **Clubs**
Professional club/organization (separate from national teams)

```json
{
  "id": "man-utd",
  "name": "Manchester United",
  "shortName": "Man Utd",
  "countryId": "england",
  "founded": 1878,
  "city": "Manchester"
}
```

**Relationships:**
- `countryId` → Countries

**Future expansion:**
- Add more clubs (AC Milan, Real Madrid, etc.)
- Store city, founded year, stadium, etc.

---

### 3. **National Teams**
Country's national football team (linked to countries)

```json
{
  "id": "brazil",
  "name": "Brazil",
  "countryId": "brazil",
  "isNationalTeam": true
}
```

**Relationships:**
- `countryId` → Countries

---

### 4. **Players**
**ONE record per player, ever.** No duplicates.

```json
{
  "id": "george-best",
  "name": "George Best",
  "countryId": "northern-ireland",
  "position": "RW",
  "overallRating": 90,
  "attackRating": 92,
  "defenceRating": 68,
  "stamina": 88
}
```

**Key Features:**
- `id` is unique and permanent (e.g., "george-best", not "george-best-1968")
- `countryId` identifies player's national team
- Position is their natural position
- Ratings are career highs/representative values

**Relationships:**
- `countryId` → Countries

**Why this matters:**
- George Best appears in Manchester United 1968, 1994, 2008, etc.
- He has ONE player record
- Different teams reference him via his `playerId`

---

### 5. **Classic Teams**
Time-specific lineup (e.g., "Brazil 1970 World Cup Winners")

```json
{
  "id": "brazil-1970",
  "name": "Brazil 1970",
  "countryId": "brazil",
  "year": 1970,
  "season": "1970 World Cup",
  "description": "1970 World Cup Champions",
  "players": [
    {
      "playerId": "pele",
      "position": "ST",
      "number": null
    },
    {
      "playerId": "jairzinho",
      "position": "RW",
      "number": null
    }
  ]
}
```

**Relationships:**
- `countryId` → Countries
- `players[].playerId` → Players (many-to-one)

**Why this structure:**
- Same player can appear in multiple classic teams
- Each team has its own formation and year
- Queries are fast (no nested data duplicates)

---

## Relationship Map

```
Countries
  ↑
  ├── National Teams (one-to-many)
  ├── Clubs (one-to-many)
  └── Players (one-to-many)

Classic Teams
  ├── countryId → Countries
  └── players[] → Players (many-to-many via playerId)
```

---

## How to Query

### Get all players from a country:
```javascript
const players = allPlayers.filter(p => p.countryId === 'england');
```

### Get a classic team's full roster with player details:
```javascript
const team = classicTeams.find(t => t.id === 'brazil-1970');
const roster = team.players.map(tp => ({
  ...allPlayers.find(p => p.id === tp.playerId),
  position: tp.position,
  number: tp.number
}));
```

### Find all teams a player appeared in:
```javascript
const playerTeams = classicTeams.filter(t => 
  t.players.some(p => p.playerId === 'george-best')
);
```

---

## Migration Notes

### What Changed:
✓ Players deduplicated (157 unique vs 200+ old records)
✓ Proper foreign key relationships
✓ Separate countries/clubs/national teams
✓ Easier to query and maintain

### What Stayed the Same:
✓ All 16 classic teams preserved
✓ All player stats intact
✓ Same simulation logic works

### Old IDs vs New IDs:

| Old Structure | New Structure | Change |
|---|---|---|
| `george-best-1968` | `george-best` | Removed year suffix |
| Embedded in team | Reference by playerId | Now separate |
| Multiple entries per player | Single player record | Deduplicated |

---

## Future Improvements

### To Scale to a Real Database:

1. **SQL Schema:**
   ```sql
   CREATE TABLE countries (
     id VARCHAR(50) PRIMARY KEY,
     name VARCHAR(100),
     code CHAR(2)
   );
   
   CREATE TABLE players (
     id VARCHAR(100) PRIMARY KEY,
     name VARCHAR(100),
     country_id VARCHAR(50) REFERENCES countries,
     position VARCHAR(10),
     overall_rating INT,
     ...
   );
   
   CREATE TABLE classic_teams (
     id VARCHAR(100) PRIMARY KEY,
     name VARCHAR(100),
     country_id VARCHAR(50) REFERENCES countries,
     year INT,
     ...
   );
   
   CREATE TABLE classic_team_players (
     classic_team_id VARCHAR(100) REFERENCES classic_teams,
     player_id VARCHAR(100) REFERENCES players,
     position VARCHAR(10),
     number INT,
     PRIMARY KEY (classic_team_id, player_id)
   );
   ```

2. **Add to TypeScript:**
   ```typescript
   interface Country {
     id: string;
     name: string;
     code: string;
   }
   
   interface Player {
     id: string;
     name: string;
     countryId: string;
     position: Position;
     overallRating: number;
     ...
   }
   ```

3. **Load in App:**
   ```typescript
   // Same interface, different source (DB instead of JSON)
   const countries = await db.countries.find();
   const players = await db.players.find();
   const teams = await db.classicTeams.find();
   ```

---

## Files

- **`public/teams-data.json`** - Old structure (deprecated, keep for reference)
- **`public/teams-data-normalized.json`** - New normalized structure (active)
- **`scripts/normalize-teams-data.mjs`** - Transformation script (run if old data changes)

## To Regenerate Normalized Data

```bash
cd web
node scripts/normalize-teams-data.mjs
```

This will output the latest normalized JSON from the old structure.
