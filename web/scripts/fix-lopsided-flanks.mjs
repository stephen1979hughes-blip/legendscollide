// One-off data fix: correct the two classic-team roster overrides flagged
// by /api/admin/validate's lopsided-flank warning (see git history for the
// TeamPitch.tsx display fallback this was previously masked by). Only the
// per-team roster override changes, not the player's own base `position` —
// dataProcessor.ts's `tp.position || player.position` exists precisely so a
// player's role in one specific XI can differ from their usual one without
// relabelling them everywhere else in the app.
import fs from 'fs';

const path = 'public/teams-data-normalized.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

function setRosterPosition(teamId, playerId, position) {
  const team = data.classicTeams.find((t) => t.id === teamId);
  if (!team) throw new Error(`Team not found: ${teamId}`);
  const entry = team.players.find((p) => p.playerId === playerId);
  if (!entry) throw new Error(`Player ${playerId} not found on ${teamId}`);
  const before = entry.position;
  entry.position = position;
  console.log(`${teamId}: ${playerId} ${before} -> ${position}`);
}

setRosterPosition('france-2006', 'eric-abidal', 'RB');
setRosterPosition('germany-2014', 'mario-gotze', 'LW');

// Matches the file's existing formatting exactly (2-space indent, no
// trailing newline) so the diff is just the two changed values.
fs.writeFileSync(path, JSON.stringify(data, null, 2));
console.log('Saved.');
