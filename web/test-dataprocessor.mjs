import fs from 'fs';

const rawData = JSON.parse(fs.readFileSync('public/teams-data-normalized.json', 'utf-8'));

const playersById = new Map();
rawData.players.forEach(p => playersById.set(p.id, p));

const clubs = [];

// Test club processing
rawData.clubs.forEach(club => {
    let allTimePlayers = [];
    
    if (club.roster && Array.isArray(club.roster)) {
        console.log(`✓ ${club.name}: has roster with ${club.roster.length} playerIds`);
        allTimePlayers = club.roster
            .map(playerId => {
                const player = playersById.get(playerId);
                return player ? { id: player.id, name: player.name, countryId: player.countryId } : null;
            })
            .filter(p => p !== null);
        
        if (club.id === 'man-utd') {
            console.log('  Manchester United players sample:');
            allTimePlayers.slice(0, 3).forEach(p => console.log(`    - ${p.name} (${p.countryId})`));
        }
    } else {
        console.log(`✗ ${club.name}: NO ROSTER FOUND - will fall back to country`);
    }
    
    clubs.push({
        id: club.id,
        name: club.name,
        allTimePlayers: allTimePlayers
    });
});

console.log('\n\nTotal clubs processed:', clubs.length);
clubs.forEach(c => console.log(`  ${c.name}: ${c.allTimePlayers.length} players`));
