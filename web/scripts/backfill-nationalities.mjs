/**
 * Backfill the `countryId` left blank by migrate-legacy-teams.mjs.
 *
 * The retired .NET dataset had no nationality field at all, so players
 * migrated from club sides (Liverpool, Ajax, Milan, …) arrived with an empty
 * countryId and were therefore missing from every country grouping in the
 * Custom XI builder. National sides were fine — their nationality is implied
 * by the team.
 *
 * Assignments are split deliberately:
 *   KNOWN    — real players whose nationality is a matter of record.
 *   INFERRED — names that do not correspond to a footballer who played for
 *              that side; the legacy dataset appears to have invented them.
 *              They fall back to the club's home country so they at least
 *              group somewhere. Listed separately so they stay easy to audit.
 *
 * Also drops two leftover admin test records (`debug-test`, `logging-test`)
 * that are referenced by no team or roster.
 *
 * Usage: node scripts/backfill-nationalities.mjs [--write]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NORMALIZED = path.resolve(__dirname, '..', 'public', 'teams-data-normalized.json');
const write = process.argv.includes('--write');

const NEW_COUNTRIES = [
  { id: 'sweden', name: 'Sweden', code: 'SE' },
  { id: 'montenegro', name: 'Montenegro', code: 'ME' },
];

/** Real players; nationality is a matter of record. */
const KNOWN = {
  // AC Milan 1994
  'alessandro-costacurta': 'italy',
  'daniele-massaro': 'italy',
  'demetrio-albertini': 'italy',
  'franco-baresi': 'italy',
  'mauro-tassotti': 'italy',
  'paolo-maldini': 'italy',
  'roberto-donadoni': 'italy',
  'sebastiano-rossi': 'italy',
  'zvonimir-boban': 'croatia',

  // Ajax 1974
  'arie-haan': 'netherlands',
  'barry-hulshoff': 'netherlands',
  'danny-blind': 'netherlands',
  'heinz-stuy': 'netherlands',
  'johan-neeskens': 'netherlands',
  'johnny-rep': 'netherlands',
  'piet-schrijvers': 'netherlands',
  'ruud-krol': 'netherlands',
  'sjaak-swart': 'netherlands',
  'wim-jansen': 'netherlands',

  // Arsenal 2004
  'bacary-sagna': 'france',
  'dennis-bergkamp': 'netherlands',
  'fredrik-ljungberg': 'sweden',
  'jens-lehmann': 'germany',
  'sol-campbell': 'england',

  // Barcelona 2011
  'dani-alves': 'brazil',
  'lionel-messi': 'argentina',
  pedro: 'spain',
  xavi: 'spain',

  // Liverpool 1984
  'alan-hansen': 'scotland',
  'graeme-souness': 'scotland',
  'john-toshack': 'wales',
  'john-wark': 'scotland',
  'mark-lawrenson': 'ireland', // born in England, capped by the Republic
  'phil-neal': 'england',
  'ray-clemence': 'england',
  'ray-kennedy': 'england',
  'steve-heighway': 'ireland', // born in England, capped by the Republic

  // Napoli 1990
  careca: 'brazil',
  'ciro-ferrara': 'italy',
  'fernando-de-napoli': 'italy',
  'gianfranco-zola': 'italy',
  'gianluca-vialli': 'italy',
  'salvatore-bagni': 'italy',

  // Real Madrid 2014
  marcelo: 'brazil',

  // Red Star Belgrade 1991
  'dejan-savicevic': 'montenegro',
  'dragoslav-jevric': 'serbia',
  'miodrag-belodedici': 'romania',
  'robert-prosinecski': 'croatia',
  'savo-milosevic': 'serbia',
  'sinisa-mihajlovic': 'serbia',
  'slavisa-jokanovic': 'serbia',
};

/**
 * Names that do not match a footballer who played for that side — apparently
 * invented when the legacy dataset was authored. Assigned the club's home
 * country as a placeholder, NOT as a factual claim.
 */
const INFERRED = {
  'alessandro-reuta': 'italy', // Napoli
  'antonio-giordano': 'italy', // Napoli
  'ivo-udal': 'italy', // Napoli
  'jorge-da-silva': 'uruguay', // Napoli; name matches a Uruguayan forward, listed here as a defender
  'branko-crvenkovic': 'serbia', // Red Star
  'darko-micanovic': 'serbia', // Red Star
  'vinije-komatinovic': 'serbia', // Red Star
  'vladimir-matic': 'serbia', // Red Star
};

/** Leftover admin test records; referenced by no team or club roster. */
const DROP = ['debug-test', 'logging-test'];

const data = JSON.parse(fs.readFileSync(NORMALIZED, 'utf-8'));

// --- 1. reference data -------------------------------------------------------
for (const c of NEW_COUNTRIES) {
  if (!data.countries.some((x) => x.id === c.id)) data.countries.push(c);
}
data.countries.sort((a, b) => a.name.localeCompare(b.name));

// --- 2. drop the test records ------------------------------------------------
const dropped = [];
const prunedRefs = [];
for (const id of DROP) {
  // A classic team is real content — refuse to touch one. A club roster entry
  // for a test record is itself part of the mess, so prune it.
  const inTeams = data.classicTeams
    .filter((t) => t.players.some((p) => p.playerId === id))
    .map((t) => t.id);
  if (inTeams.length) {
    console.log(`! refusing to drop ${id}: named in classic team(s) ${inTeams.join(', ')}`);
    continue;
  }
  for (const club of data.clubs) {
    if ((club.roster || []).includes(id)) {
      club.roster = club.roster.filter((p) => p !== id);
      prunedRefs.push(`${club.id}.roster -= ${id}`);
    }
  }
  const before = data.players.length;
  data.players = data.players.filter((p) => p.id !== id);
  if (data.players.length < before) dropped.push(id);
}

// --- 3. backfill -------------------------------------------------------------
const known = new Set(data.countries.map((c) => c.id));
const applied = { known: 0, inferred: 0 };
const problems = [];

for (const [id, countryId] of Object.entries({ ...KNOWN, ...INFERRED })) {
  const player = data.players.find((p) => p.id === id);
  if (!player) {
    problems.push(`no such player: ${id}`);
    continue;
  }
  if (!known.has(countryId)) {
    problems.push(`unknown country "${countryId}" for ${id}`);
    continue;
  }
  if (player.countryId) {
    problems.push(`${id} already had countryId "${player.countryId}"; left alone`);
    continue;
  }
  player.countryId = countryId;
  if (KNOWN[id]) applied.known++;
  else applied.inferred++;
}

// --- 4. strip admin-response artifacts ---------------------------------------
// The Express admin server enriches players with `clubs`/`classicTeams` for the
// UI; those derived fields should never have been written back to the file.
let stripped = 0;
for (const p of data.players) {
  if ('clubs' in p || 'classicTeams' in p) {
    delete p.clubs;
    delete p.classicTeams;
    stripped++;
  }
}

data.metadata = { ...data.metadata, lastUpdated: new Date().toISOString() };

// --- report ------------------------------------------------------------------
console.log(`countries added   : ${NEW_COUNTRIES.map((c) => c.id).join(', ')}`);
console.log(`test records drop : ${dropped.length ? dropped.join(', ') : 'none'}`);
console.log(`references pruned : ${prunedRefs.length ? prunedRefs.join(', ') : 'none'}`);
console.log(`known assigned    : ${applied.known}`);
console.log(`inferred assigned : ${applied.inferred}`);
console.log(`artifact fields   : ${stripped} player(s) cleaned`);
if (problems.length) {
  console.log('problems:');
  problems.forEach((p) => console.log('  !', p));
}
const remaining = data.players.filter((p) => !p.countryId);
console.log(`players still missing countryId: ${remaining.length}`);
remaining.forEach((p) => console.log('  -', p.id, p.name));

if (write) {
  fs.writeFileSync(NORMALIZED, JSON.stringify(data, null, 2));
  console.log(`\nwritten -> ${NORMALIZED}`);
} else {
  console.log('\ndry run — pass --write to apply');
}
