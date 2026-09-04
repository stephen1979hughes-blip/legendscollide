/**
 * Rewrites the OG/Twitter meta tags in the served HTML shell for
 * /m/<teamA>-v-<teamB>/<seed>, so a crawler that never runs JS (Discord,
 * Slack, X, Facebook) sees the real scoreline instead of the site-wide
 * defaults baked into web/index.html.
 *
 * This recomputes the match itself — nothing about a permalink is stored
 * anywhere, the seed and team ids *are* the state (see
 * web/src/services/api.ts and web/src/utils/matchPermalink.ts). That's why
 * this function needs the same team data and the same engine as the app: it
 * has to run the identical deterministic simulation to know the scoreline.
 *
 * Relative imports (not the `@fm/match-engine` Vite alias) because this runs
 * through Wrangler's own esbuild bundling, not Vite — see CLAUDE.md on the
 * alias only existing for the web/ build.
 */
import type { PagesFunction } from '@cloudflare/workers-types';
import { simulateMatch, type EngineTeam } from '../../../packages/match-engine/src/index.ts';
import { parseMatchup, decodeSeed } from '../../../web/src/utils/matchPermalink.ts';

interface RawPlayer {
  id: string;
  name: string;
  position: string;
  overallRating: number;
  attackRating: number;
  defenceRating: number;
  stamina: number;
}

interface RawClassicTeam {
  id: string;
  name: string;
  players: Array<{ playerId: string; position: string }>;
}

interface RawData {
  players: RawPlayer[];
  classicTeams: RawClassicTeam[];
}

function buildEngineTeam(raw: RawData, teamId: string): { engineTeam: EngineTeam; name: string } | null {
  const classicTeam = raw.classicTeams.find((t) => t.id === teamId);
  if (!classicTeam) return null;

  const playersById = new Map(raw.players.map((p) => [p.id, p]));
  const players = classicTeam.players
    .map((tp) => {
      const p = playersById.get(tp.playerId);
      if (!p) return null;
      return {
        id: p.id,
        name: p.name,
        position: tp.position || p.position,
        overallRating: p.overallRating,
        attackRating: p.attackRating,
        defenceRating: p.defenceRating,
        stamina: p.stamina,
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  return { engineTeam: { id: classicTeam.id, name: classicTeam.name, players }, name: classicTeam.name };
}

class SetAttribute {
  constructor(
    private attr: string,
    private value: string
  ) {}
  element(el: Element) {
    el.setAttribute(this.attr, this.value);
  }
}

class SetTextContent {
  constructor(private value: string) {}
  element(el: Element) {
    el.setInnerContent(this.value);
  }
}

function param(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export const onRequest: PagesFunction = async (context) => {
  // Always fall through to the static shell first — that's the response
  // we'll either return untouched or rewrite below.
  const response = await context.next();

  const matchup = param(context.params.matchup as string | string[] | undefined);
  const seedParam = param(context.params.seed as string | string[] | undefined);
  if (!matchup || !seedParam) return response;

  const parts = parseMatchup(matchup);
  const seed = decodeSeed(seedParam);
  if (!parts || seed === null) return response;

  try {
    const dataUrl = new URL('/teams-data-normalized.json', context.request.url);
    const dataRes = await context.env.ASSETS.fetch(dataUrl.toString());
    if (!dataRes.ok) return response;
    const raw = (await dataRes.json()) as RawData;

    const a = buildEngineTeam(raw, parts.teamAId);
    const b = buildEngineTeam(raw, parts.teamBId);
    // Unknown or custom-XI team id: not resolvable from the URL alone, so
    // serve the default shell rather than a broken or misleading preview.
    if (!a || !b) return response;

    const result = simulateMatch({ teamA: a.engineTeam, teamB: b.engineTeam, seed });
    const lastGoal =
      result.goalsA[result.goalsA.length - 1] ?? result.goalsB[result.goalsB.length - 1] ?? null;

    const title = `${a.name} ${result.scoreA} – ${result.scoreB} ${b.name} | Legends Collide`;
    const description = lastGoal
      ? `${a.name} ${result.scoreA} – ${result.scoreB} ${b.name}. ${lastGoal.playerName} among the scorers — watch it play out.`
      : `${a.name} ${result.scoreA} – ${result.scoreB} ${b.name}. Watch it play out.`;
    const canonicalUrl = new URL(context.request.url).origin + new URL(context.request.url).pathname;

    return new HTMLRewriter()
      .on('title', new SetTextContent(title))
      .on('meta[property="og:title"]', new SetAttribute('content', title))
      .on('meta[name="twitter:title"]', new SetAttribute('content', title))
      .on('meta[property="og:description"]', new SetAttribute('content', description))
      .on('meta[name="twitter:description"]', new SetAttribute('content', description))
      .on('meta[property="og:url"]', new SetAttribute('content', canonicalUrl))
      .on('link[rel="canonical"]', new SetAttribute('href', canonicalUrl))
      .transform(response);
  } catch (err) {
    console.error('OG rewrite failed for', matchup, seedParam, err);
    return response;
  }
};
