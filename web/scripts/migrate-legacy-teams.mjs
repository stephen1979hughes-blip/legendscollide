/**
 * One-off migration: fold the legacy .NET dataset (teams-players.json, keyed by
 * ids like `mu-1`, preserved in scripts/legacy/) into the normalized dataset (slug ids like `alex-stepney`),
 * so teams-data-normalized.json becomes the single source of truth and the
 * Azure Functions app can be deleted.
 *
 * Merges the 10 classic teams that existed only in the legacy set, their
 * players (deduped against the normalized set by name), and all player bios.
 *
 * Usage: node scripts/migrate-legacy-teams.mjs [--write]
 * Without --write it performs a dry run and prints the report only.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB = path.resolve(__dirname, '..');
const REPO = path.resolve(WEB, '..');

const NORMALIZED = path.join(WEB, 'public', 'teams-data-normalized.json');
const LEGACY = path.join(__dirname, 'legacy', 'teams-players.json');
const BIOS = path.join(__dirname, 'legacy', 'player-bios.json');

const write = process.argv.includes('--write');

// Which club or national team each legacy-only classic team belongs to.
// `countryId` on a classicTeam holds a club id for club sides and a country id
// for national sides — matching the existing convention in the normalized file.
const TEAM_OWNER = {
  'liverpool-1984': { owner: 'liverpool', kind: 'club' },
  'barcelona-2011': { owner: 'barcelona', kind: 'club' },
  'napoli-1990': { owner: 'napoli', kind: 'club' },
  'ac-milan-1994': { owner: 'ac-milan', kind: 'club' },
  'real-madrid-2014': { owner: 'real-madrid', kind: 'club' },
  'red-star-belgrade-1991': { owner: 'red-star-belgrade', kind: 'club' },
  'ajax-1974': { owner: 'ajax', kind: 'club' },
  'arsenal-2004': { owner: 'arsenal', kind: 'club' },
  'spain-2010': { owner: 'spain', kind: 'national' },
  'hungary-1954': { owner: 'hungary', kind: 'national' },
};

const NEW_CLUBS = [
  { id: 'napoli', name: 'Napoli', shortName: 'Napoli', countryId: 'italy', founded: 1926, city: 'Naples', roster: [] },
  { id: 'red-star-belgrade', name: 'Red Star Belgrade', shortName: 'Red Star', countryId: 'serbia', founded: 1945, city: 'Belgrade', roster: [] },
  { id: 'arsenal', name: 'Arsenal', shortName: 'Arsenal', countryId: 'england', founded: 1886, city: 'London', roster: [] },
];

// `hungary` is needed by hungary-1954. `colombia` and `russia` are pre-existing
// gaps: six players already referenced them, so those players were silently
// dropped from every country grouping.
const NEW_COUNTRIES = [
  { id: 'hungary', name: 'Hungary', code: 'HU' },
  { id: 'colombia', name: 'Colombia', code: 'CO' },
  { id: 'russia', name: 'Russia', code: 'RU' },
];
const NEW_NATIONAL_TEAMS = [{ id: 'hungary', name: 'Hungary', countryId: 'hungary', isNationalTeam: true }];

const slugify = (name) =>
  name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const norm = JSON.parse(fs.readFileSync(NORMALIZED, 'utf-8'));
const legacy = JSON.parse(fs.readFileSync(LEGACY, 'utf-8'));
const bios = JSON.parse(fs.readFileSync(BIOS, 'utf-8')).bios;

const report = { matched: [], created: [], ratingDiffs: [], biosApplied: 0, skipped: [], collisions: [] };

// Match on the slugified name, not the raw one: the legacy set spells names
// without diacritics ("Victor Valdes") where the normalized set uses them
// ("Víctor Valdés"), and a raw comparison silently duplicates those players.
const byName = new Map(norm.players.map((p) => [slugify(p.name), p]));
const byId = new Map(norm.players.map((p) => [p.id, p]));
const legacyById = new Map(legacy.players.map((p) => [p.id, p]));
const existingTeamIds = new Set(norm.classicTeams.map((t) => t.id));

/** Resolve a legacy player to a normalized player, creating one if needed. */
function resolvePlayer(legacyPlayer, countryId) {
  const existing = byName.get(slugify(legacyPlayer.name));
  if (existing) {
    report.matched.push(`${legacyPlayer.id} -> ${existing.id} (${legacyPlayer.name})`);
    // Keep the curated normalized ratings; record where the two sets disagree.
    if (existing.overallRating !== legacyPlayer.overallRating) {
      report.ratingDiffs.push(
        `${existing.id}: normalized ${existing.overallRating} vs legacy ${legacyPlayer.overallRating} (kept normalized)`
      );
    }
    return existing;
  }

  let id = slugify(legacyPlayer.name);
  if (byId.has(id)) {
    report.collisions.push(`slug collision for "${legacyPlayer.name}" -> ${id}; suffixed`);
    let n = 2;
    while (byId.has(`${id}-${n}`)) n++;
    id = `${id}-${n}`;
  }

  const created = {
    id,
    name: legacyPlayer.name,
    countryId: countryId ?? '',
    position: legacyPlayer.position,
    overallRating: legacyPlayer.overallRating,
    attackRating: legacyPlayer.attackRating,
    defenceRating: legacyPlayer.defenceRating,
    stamina: legacyPlayer.stamina,
  };
  norm.players.push(created);
  byId.set(id, created);
  byName.set(slugify(created.name), created);
  report.created.push(`${legacyPlayer.id} -> ${id} (${legacyPlayer.name})`);
  return created;
}

// --- 1. reference data the new teams depend on -------------------------------
for (const c of NEW_COUNTRIES) {
  if (!norm.countries.some((x) => x.id === c.id)) norm.countries.push(c);
}
norm.nationalTeams = norm.nationalTeams ?? [];
for (const t of NEW_NATIONAL_TEAMS) {
  if (!norm.nationalTeams.some((x) => x.id === t.id)) norm.nationalTeams.push(t);
}
for (const c of NEW_CLUBS) {
  if (!norm.clubs.some((x) => x.id === c.id)) norm.clubs.push(c);
}
norm.countries.sort((a, b) => a.name.localeCompare(b.name));
norm.clubs.sort((a, b) => a.name.localeCompare(b.name));

// --- 2. migrate the legacy-only classic teams --------------------------------
for (const team of legacy.teams) {
  if (existingTeamIds.has(team.id)) {
    report.skipped.push(`${team.id} (already in normalized set)`);
    continue;
  }
  const owner = TEAM_OWNER[team.id];
  if (!owner) throw new Error(`No owner mapping for legacy team ${team.id}`);

  // National sides imply their players' nationality; club sides do not.
  const impliedCountry = owner.kind === 'national' ? owner.owner : '';

  const players = team.playerIds.map((pid) => {
    const lp = legacyById.get(pid);
    if (!lp) throw new Error(`Legacy team ${team.id} references missing player ${pid}`);
    const resolved = resolvePlayer(lp, impliedCountry);
    return { playerId: resolved.id, position: lp.position, number: null };
  });

  // Club sides: add the squad to the club roster so the Custom XI builder,
  // which groups by club/country rather than by classic team, can see them.
  if (owner.kind === 'club') {
    const club = norm.clubs.find((c) => c.id === owner.owner);
    club.roster = club.roster ?? [];
    for (const p of players) if (!club.roster.includes(p.playerId)) club.roster.push(p.playerId);
  }

  norm.classicTeams.push({
    id: team.id,
    name: `${team.name} ${team.year}`,
    countryId: owner.owner,
    year: team.year,
    season: `${team.year - 1}-${String(team.year).slice(2)}`,
    description: `${team.name} ${team.year}`,
    players,
  });
}

// --- 3. carry over every bio we can resolve ----------------------------------
for (const [legacyId, bio] of Object.entries(bios)) {
  const lp = legacyById.get(legacyId);
  if (!lp) continue;
  const target = byName.get(slugify(lp.name));
  if (target && !target.bio) {
    target.bio = bio;
    report.biosApplied++;
  }
}

norm.classicTeams.sort((a, b) => a.id.localeCompare(b.id));
norm.players.sort((a, b) => a.id.localeCompare(b.id));
norm.metadata = {
  ...norm.metadata,
  version: '3.0',
  description: 'Normalized football data with relationships (single source of truth)',
  lastUpdated: new Date().toISOString(),
};

// --- report ------------------------------------------------------------------
console.log(`matched to existing players    : ${report.matched.length}`);
console.log(`newly created players          : ${report.created.length}`);
console.log(`bios applied                   : ${report.biosApplied}`);
console.log(`teams skipped (already present): ${report.skipped.length}`);
console.log(`slug collisions                : ${report.collisions.length}`);
report.collisions.forEach((c) => console.log('  !', c));
console.log(`rating disagreements           : ${report.ratingDiffs.length}`);
report.ratingDiffs.slice(0, 10).forEach((d) => console.log('  -', d));
console.log();
console.log(`TOTAL classic teams: ${norm.classicTeams.length}, players: ${norm.players.length}`);
console.log(`players with no countryId      : ${norm.players.filter((p) => !p.countryId).length}`);

if (write) {
  fs.copyFileSync(NORMALIZED, `${NORMALIZED}.bak`);
  fs.writeFileSync(NORMALIZED, JSON.stringify(norm, null, 2));
  console.log(`\nwritten -> ${NORMALIZED} (backup at teams-data-normalized.json.bak)`);
} else {
  console.log('\ndry run — pass --write to apply');
}
