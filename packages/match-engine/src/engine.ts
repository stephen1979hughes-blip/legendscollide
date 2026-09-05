/**
 * The TypeScript match engine.
 *
 * Ported from web/src/services/matchEngine.ts. The simulation logic is
 * unchanged; the differences are structural:
 *   - every Math.random() now draws from a seeded Rng, so a match is
 *     reproducible from (teamA, teamB, seed)
 *   - it depends on the engine's own types rather than the web app's
 */
import { Rng } from './rng.ts';
import type {
  EnginePlayer,
  EngineTeam,
  Goal,
  MatchEvent,
  MatchInput,
  MatchResult,
  PlayerStats,
  PositionCategory,
} from './types.ts';

interface PlayerCardState {
  yellowCards: number;
  redCards: number;
  ejected: boolean;
}

interface MatchSimulationState {
  scoreA: number;
  scoreB: number;
  possession: number; // A's possession percentage
  playerCardsA: Map<string, PlayerCardState>;
  playerCardsB: Map<string, PlayerCardState>;
  playerStatsA: Map<string, PlayerStats>;
  playerStatsB: Map<string, PlayerStats>;
  events: MatchEvent[];
}

const SKILL_EVENT_WEIGHTS = {
  GK: { save: 0.4, punch: 0.15, clearance: 0.2 },
  DF: { tackle: 0.35, block: 0.3, clearance: 0.25 },
  MF: { tackle: 0.2, pass: 0.4, dribble: 0.25 },
  FW: { dribble: 0.35, pass: 0.3 },
};

const CARD_ESCALATION = {
  first: 0.6, // 60% yellow card on first foul
  second: 0.8, // 80% yellow card on second foul (already has one)
  thirdWithYellow: 0.99, // 99% red card if has yellow + fouls again
};

function getPositionCategory(pos: string): PositionCategory {
  const position = pos.toUpperCase();
  if (['GK'].includes(position)) return 'GK';
  if (['DF', 'CB', 'RB', 'LB', 'RWB', 'LWB'].includes(position)) return 'DF';
  if (['MF', 'CM', 'RM', 'LM', 'CDM', 'CAM'].includes(position)) return 'MF';
  if (['FW', 'ST', 'CF', 'LW', 'RW', 'CAM'].includes(position)) return 'FW';
  return 'MF';
}

function selectRandomPlayer(rng: Rng, team: EngineTeam): string {
  return rng.pick(team.players).name;
}

function selectPlayerByPosition(rng: Rng, team: EngineTeam, position: PositionCategory): string {
  const candidates = team.players.filter((p) => getPositionCategory(p.position) === position);
  if (candidates.length === 0) return selectRandomPlayer(rng, team);
  return rng.pick(candidates).name;
}

function initializePlayerStats(team: EngineTeam): Map<string, PlayerStats> {
  const stats = new Map<string, PlayerStats>();
  team.players.forEach((player) => {
    stats.set(player.name, {
      tackles: 0,
      clearances: 0,
      dribbles: 0,
      passes: 0,
      saves: 0,
      punches: 0,
      shotsOnTarget: 0,
      yellowCards: 0,
      redCards: 0,
    });
  });
  return stats;
}

function initializeCardState(team: EngineTeam): Map<string, PlayerCardState> {
  const cards = new Map<string, PlayerCardState>();
  team.players.forEach((player) => {
    cards.set(player.name, { yellowCards: 0, redCards: 0, ejected: false });
  });
  return cards;
}

function generateSkillEvent(
  rng: Rng,
  team: EngineTeam,
  state: MatchSimulationState,
  isTeamA: boolean
): MatchEvent | null {
  const positionCategories: PositionCategory[] = ['GK', 'DF', 'MF', 'FW'];
  const position = rng.pick(positionCategories);

  const playerName = selectPlayerByPosition(rng, team, position);
  const stats = isTeamA ? state.playerStatsA : state.playerStatsB;
  const playerStats = stats.get(playerName);
  if (!playerStats) return null;

  const weights = SKILL_EVENT_WEIGHTS[position] as Record<string, number>;
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  const rand = rng.next() * totalWeight;

  let cumulative = 0;
  let skillType: NonNullable<MatchEvent['skillType']> = 'pass';

  for (const [skill, weight] of Object.entries(weights)) {
    cumulative += weight;
    if (rand <= cumulative) {
      skillType = skill as NonNullable<MatchEvent['skillType']>;
      break;
    }
  }

  // Update player stats
  if (skillType === 'tackle') playerStats.tackles++;
  else if (skillType === 'block') playerStats.tackles++; // Count as defensive action
  else if (skillType === 'clearance') playerStats.clearances++;
  else if (skillType === 'dribble') playerStats.dribbles++;
  else if (skillType === 'pass') playerStats.passes++;
  else if (skillType === 'save') playerStats.saves++;
  else if (skillType === 'punch') playerStats.punches++;

  const skillDescriptions: Record<string, string[]> = {
    tackle: [
      `${playerName} makes a crucial tackle`,
      `${playerName} wins the ball with a strong challenge`,
      `Strong tackle by ${playerName}`,
    ],
    block: [
      `${playerName} blocks the shot`,
      `Excellent block by ${playerName}`,
      `${playerName} throws himself in front of the ball`,
    ],
    clearance: [
      `${playerName} clears the danger`,
      `${playerName} heads it away`,
      `Safe clearance from ${playerName}`,
    ],
    dribble: [
      `${playerName} glides past a defender`,
      `Skillful dribble from ${playerName}`,
      `${playerName} beats his man`,
    ],
    pass: [
      `${playerName} plays a key pass`,
      `Excellent passing from ${playerName}`,
      `${playerName} threads a ball through`,
    ],
    save: [
      `Wonderful save by ${playerName}!`,
      `${playerName} denies the striker`,
      `Brilliant save from ${playerName}`,
    ],
    punch: [
      `${playerName} punches it clear`,
      `${playerName} safely gathers the cross`,
      `${playerName} collects it well`,
    ],
  };

  const text = rng.pick(skillDescriptions[skillType]);

  return {
    minute: 0, // Will be set by caller
    type: 'skill',
    text,
    scoreA: state.scoreA,
    scoreB: state.scoreB,
    playerName,
    playerTeam: isTeamA ? 'A' : 'B',
    skillType,
  };
}

/**
 * NOTE: this is currently unreachable — nothing calls it, so no simulated match
 * ever produces a booking, and PlayerStats.yellowCards/redCards are always 0.
 * Carried over from the original engine as-is rather than silently dropped.
 * Wiring it into the event loop is a behaviour change, not a refactor.
 */
export function generateFoulEvent(
  rng: Rng,
  team: EngineTeam,
  state: MatchSimulationState,
  isTeamA: boolean,
  minute: number
): MatchEvent | null {
  const cards = isTeamA ? state.playerCardsA : state.playerCardsB;
  const candidates = team.players.filter((p) => {
    const cardState = cards.get(p.name);
    return cardState && !cardState.ejected;
  });

  if (candidates.length === 0) return null;

  const playerName = rng.pick(candidates).name;
  const cardState = cards.get(playerName)!;
  const stats = isTeamA ? state.playerStatsA : state.playerStatsB;
  const playerStats = stats.get(playerName);

  if (!playerStats) return null;

  let cardType: 'yellow' | 'red' | null = null;

  if (cardState.redCards > 0) {
    return null; // Player already ejected
  }

  if (cardState.yellowCards === 0) {
    if (rng.next() < CARD_ESCALATION.first) {
      cardType = 'yellow';
      cardState.yellowCards++;
      playerStats.yellowCards++;
    }
  } else if (cardState.yellowCards === 1 && cardState.redCards === 0) {
    if (rng.next() < CARD_ESCALATION.thirdWithYellow) {
      cardType = 'red';
      cardState.redCards++;
      cardState.ejected = true;
      playerStats.redCards++;
    } else if (rng.next() < CARD_ESCALATION.second) {
      cardType = 'yellow';
      cardState.yellowCards++;
      playerStats.yellowCards++;
    }
  }

  if (!cardType) return null;

  const cardText =
    cardType === 'yellow'
      ? `${playerName} receives a yellow card`
      : `${playerName} sent off! Red card!`;

  return {
    minute,
    type: 'card',
    text: cardText,
    scoreA: state.scoreA,
    scoreB: state.scoreB,
    playerName,
    playerTeam: isTeamA ? 'A' : 'B',
    cardType,
  };
}

// ============= MATCH SIMULATION =============

function calcTeamAttack(team: EngineTeam): number {
  const fwd = team.players.filter((p) => getPositionCategory(p.position) === 'FW');
  const mid = team.players.filter((p) => getPositionCategory(p.position) === 'MF');
  const pool = fwd.length > 0 ? [...fwd, ...mid] : mid;
  if (pool.length === 0) return 70;
  return pool.reduce((s, p) => s + p.attackRating, 0) / pool.length;
}

function calcTeamDefence(team: EngineTeam): number {
  const def = team.players.filter((p) => getPositionCategory(p.position) === 'DF');
  const mid = team.players.filter((p) => getPositionCategory(p.position) === 'MF');
  const pool = def.length > 0 ? [...def, ...mid] : mid;
  if (pool.length === 0) return 70;
  return pool.reduce((s, p) => s + p.defenceRating, 0) / pool.length;
}

// ============= BALANCE =============
//
// Squad ratings are compressed: real classic XIs land between 78 and 87 on both
// the attack and the defence average, so `attack - defence` only ever spans
// about ±8.5 and usually sits within ±3. The original model fed that through
// `8 + diff * 0.05 + U(-2, 2)`, which moved the chance count by at most ±0.43
// against a ±2.0 noise band — the dice were roughly nine times louder than the
// teams, and the strongest side in the dataset beat the weakest 39% of the time.
//
// The differential now drives an exponential response rather than a linear one,
// so a few rating points compound instead of vanishing:
//
//     xG = XG_BASE * exp(diff / RATING_SCALE)
//
// That total is split evenly between the two factors the model already had — a
// better side takes more chances *and* converts a higher share of them, which is
// what keeps the shot count believable next to the scoreline:
//
//     chances    = CHANCE_BASE * exp(diff / (2 * RATING_SCALE))
//     conversion = CONV_BASE   * exp(diff / (2 * RATING_SCALE))
//
// Phase 2 (card levels, see web/src/utils/cardProgression.ts) widened the
// range `diff` actually takes on: a level-1 card plays at a common floor well
// below any classic team's rating, so a fresh squad facing even a mid-table
// classic side can show a differential in the high teens — more than double
// the classic band's own ±8.5. Feeding that raw through the single exponential
// above is a bind-from-both-ends failure: the favourite's chance count and
// conversion both hit their clamps, so does the underdog's, and the game still
// produces double-digit scorelines because the clamps were sized for the
// narrow band.
//
// Rather than retune RATING_SCALE itself — which governs the classic band and
// is what test/calibration.test.mjs's original assertions were pinned
// against — the response is now piecewise. Below RESPONSE_KNEE (the classic
// band's own ±8.5 ceiling) nothing changes: `diff / RATING_SCALE` exactly as
// before, so every classic-vs-classic fixture the original suite covers is
// computed by an identical formula and needs no re-tuning. Beyond the knee,
// the *excess* differential runs through RATING_SCALE_WIDE instead — a much
// larger divisor, so a levelled blowout keeps compounding but far more slowly
// per rating point than the classic band does. This is what lets a fresh
// level-1 squad keep a real (if slim) chance against a mid-table side while
// the strongest classic fixture is still exactly as decisive as it always was.
const RESPONSE_KNEE = 8.5;
/** Rating points beyond RESPONSE_KNEE that multiply expected goals by e. Much larger than RATING_SCALE: decisiveness growth almost flattens out past the classic band. */
const RATING_SCALE_WIDE = 96;

/** Expected goals for a side facing an exactly equal opponent. */
const XG_BASE = 1.35;
/** Rating points that multiply a side's expected goals by e, within the classic ±8.5 band. Lower = more decisive. Unchanged from the classic-only rebalance. */
const RATING_SCALE = 16;
/** Clear chances created by a side facing an exactly equal opponent. */
const CHANCE_BASE = 11;
/** Conversion at parity. Derived so CHANCE_BASE * CONV_BASE === XG_BASE. */
const CONV_BASE = XG_BASE / CHANCE_BASE;
/** Uniform ± jitter on the chance count, so an identical fixture still varies. */
const CHANCE_NOISE = 1.5;
/** Possession points gained per point of combined-strength advantage. */
const POSSESSION_PER_POINT = 0.75;

/** Half the exponential response, applied to the chance count and conversion alike. */
function ratingResponse(attack: number, defence: number): number {
  const diff = attack - defence;
  const mag = Math.min(Math.abs(diff), RESPONSE_KNEE);
  const excess = Math.abs(diff) - RESPONSE_KNEE;
  const exponent =
    Math.sign(diff) *
    (mag / (2 * RATING_SCALE) + (excess > 0 ? excess / (2 * RATING_SCALE_WIDE) : 0));
  return Math.exp(exponent);
}

function calcChances(rng: Rng, attack: number, defence: number): number {
  const raw = CHANCE_BASE * ratingResponse(attack, defence) + (rng.next() * 2 - 1) * CHANCE_NOISE;
  return Math.max(3, Math.min(22, Math.round(raw)));
}

function calcConversion(attack: number, defence: number): number {
  return Math.max(0.04, Math.min(0.35, CONV_BASE * ratingResponse(attack, defence)));
}

function simulateGoalsFromChances(
  rng: Rng,
  chances: number,
  conversionRate: number,
  team: EngineTeam,
  teamId: string
): Goal[] {
  // Build a weighted scorer pool:
  //   FW  → full attackRating weight  (primary scorers)
  //   MF  → 30% of attackRating       (midfield contributions)
  //   DF  → 5%  of attackRating       (rare set-piece headers)
  //   GK  → 0 (never scores in normal play)
  interface WeightedPlayer {
    name: string;
    weight: number;
  }
  const weightedPool: WeightedPlayer[] = [];

  for (const p of team.players) {
    const cat = getPositionCategory(p.position);
    const mult = cat === 'FW' ? 1.0 : cat === 'MF' ? 0.3 : cat === 'DF' ? 0.05 : 0;
    if (mult > 0 && p.name) {
      weightedPool.push({ name: p.name, weight: (p.attackRating || 75) * mult });
    }
  }

  // Fallback: if no weighted pool, use all outfield players
  if (weightedPool.length === 0) {
    const outfieldPlayers = team.players.filter((p) => getPositionCategory(p.position) !== 'GK');
    for (const p of outfieldPlayers) {
      if (p.name) weightedPool.push({ name: p.name, weight: p.attackRating || 75 });
    }
  }

  // If still empty, use any player
  if (weightedPool.length === 0 && team.players.length > 0) {
    for (const p of team.players) {
      if (p.name) weightedPool.push({ name: p.name, weight: 50 });
    }
  }

  const totalWeight = weightedPool.reduce((s, wp) => s + wp.weight, 0) || 1;

  // Assist pool: midfielders, fallback to full squad
  const midPool = team.players.filter((p) => getPositionCategory(p.position) === 'MF');
  const assistPool = midPool.length > 0 ? midPool : team.players;

  const pickScorer = (): string => {
    if (weightedPool.length === 0) return team.players[0]?.name || 'Unknown';
    let rand = rng.next() * totalWeight;
    for (const wp of weightedPool) {
      rand -= wp.weight;
      if (rand <= 0) return wp.name;
    }
    return weightedPool[weightedPool.length - 1].name;
  };

  const goals: Goal[] = [];
  for (let i = 0; i < chances; i++) {
    if (rng.next() < conversionRate) {
      const scorerName = pickScorer();
      const isPenalty = rng.next() > 0.92;
      const hasAssist = !isPenalty && rng.next() > 0.35;
      const candidates = assistPool.filter((p) => p.name !== scorerName);
      const assister = hasAssist && candidates.length > 0 ? rng.pick(candidates).name : undefined;
      goals.push({
        minute: 10 + rng.int(80),
        playerName: scorerName,
        teamId,
        assist: assister,
        isPenalty,
      });
    }
  }
  return goals.sort((a, b) => a.minute - b.minute);
}

export function simulateMatch({ teamA, teamB, seed }: MatchInput): MatchResult {
  const rng = new Rng(seed);
  const teamAId = teamA.id;
  const teamBId = teamB.id;

  // Rating-based simulation
  const attackA = calcTeamAttack(teamA);
  const defenceA = calcTeamDefence(teamA);
  const attackB = calcTeamAttack(teamB);
  const defenceB = calcTeamDefence(teamB);

  const chancesA = calcChances(rng, attackA, defenceB);
  const chancesB = calcChances(rng, attackB, defenceA);

  const convRateA = calcConversion(attackA, defenceB);
  const convRateB = calcConversion(attackB, defenceA);

  const goalsA = simulateGoalsFromChances(rng, chancesA, convRateA, teamA, teamAId);
  const goalsB = simulateGoalsFromChances(rng, chancesB, convRateB, teamB, teamBId);

  const scoreA = goalsA.length;
  const scoreB = goalsB.length;

  // Possession had the same problem as the chance count: dividing by the summed
  // strength of both sides (~330) reduced the widest gap in the dataset to a
  // single percentage point, so every match finished 49-51. Scaling directly off
  // the difference lets a dominant side actually hold the ball.
  const teamStrA = attackA + defenceA;
  const teamStrB = attackB + defenceB;
  const possessionA = Math.round(50 + (teamStrA - teamStrB) * POSSESSION_PER_POINT);
  const possessionAFinal = Math.max(35, Math.min(65, possessionA));

  const state: MatchSimulationState = {
    scoreA,
    scoreB,
    possession: possessionAFinal,
    playerCardsA: initializeCardState(teamA),
    playerCardsB: initializeCardState(teamB),
    playerStatsA: initializePlayerStats(teamA),
    playerStatsB: initializePlayerStats(teamB),
    events: [],
  };

  const shotsA = chancesA;
  const shotsB = chancesB;

  // Goal text generators using actual player names and team names
  const goalTemplates = (
    scorer: string,
    assist: string | undefined,
    teamName: string,
    isPenalty: boolean
  ) => {
    if (isPenalty) return `GOAL! ${scorer} steps up and converts the penalty for ${teamName}!`;
    const assistStr = assist ? ` ${assist} plays it through and ` : ' ';
    return rng.pick([
      `GOAL! ${teamName}!${assistStr}${scorer} slots it home into the bottom corner!`,
      `GOAL! What a strike from ${scorer}! A powerful effort leaves the keeper with no chance!`,
      `GOAL! ${scorer} is unmarked at the far post!${assistStr}He heads it firmly into the net!`,
      `GOAL! ${scorer} latches onto the through ball and finishes clinically!`,
      `GOAL! A brilliant individual effort from ${scorer} — he beats two defenders and fires home!`,
      `GOAL! ${scorer} cuts inside and unleashes a curling shot into the top corner!`,
      `GOAL! ${scorer} taps in from close range after a flowing ${teamName} move!`,
    ]);
  };

  const chanceTemplates = (
    attackerName: string,
    midName: string,
    keeperName: string,
    teamName: string,
    oppName: string
  ) =>
    rng.pick([
      `${attackerName} drives into the box but ${keeperName} stands firm to smother the shot!`,
      `Great move from ${teamName}! ${midName} slips in ${attackerName} but the shot goes just wide.`,
      `A stunning save! ${attackerName} looked certain to score before ${keeperName} tipped it over the bar.`,
      `${midName} drives forward and unleashes a long-range effort — wide of the post.`,
      `${attackerName} is clean through on goal but ${keeperName} makes himself big and blocks!`,
      `Corner for ${teamName}. ${midName} whips it in but the ${oppName} defence clears.`,
      `Free kick on the edge of the box. ${midName} curls it over the wall but it's saved!`,
    ]);

  const generalTemplates = (
    midName: string,
    attackerName: string,
    defName: string,
    teamName: string,
    oppName: string
  ) =>
    rng.pick([
      `${midName} drives forward from midfield, linking up with ${attackerName} in a promising position.`,
      `Good pressing from ${teamName} — ${midName} wins the ball back in their own half.`,
      `${attackerName} holds up the ball well, bringing ${midName} into play.`,
      // defName is drawn from the defending side, so the side being denied is the
      // attacking one — oppName here would name the defender's own team.
      `${defName} makes a crucial interception to deny ${teamName} a clear opening.`,
      `A creative ball from ${midName} almost breaks through the ${oppName} defence.`,
      `${teamName} winning the midfield battle through hard work from ${midName}.`,
      `Excellent defensive work from ${defName}, clearing the danger with a well-timed tackle.`,
    ]);

  const pickPlayer = (team: EngineTeam, pos: PositionCategory): string => {
    const pool = team.players.filter((p) => getPositionCategory(p.position) === pos);
    const fallback = team.players.filter((p) => getPositionCategory(p.position) === 'MF');
    const src = pool.length > 0 ? pool : fallback.length > 0 ? fallback : team.players;
    return rng.pick(src).name;
  };

  const getKeeper = (team: EngineTeam) => {
    const gk = team.players.find((p) => p.position === 'GK');
    return gk?.name ?? 'the keeper';
  };

  // All goals sorted chronologically
  const allGoals = [
    ...goalsA.map((g) => ({ ...g, team: 'A' as const })),
    ...goalsB.map((g) => ({ ...g, team: 'B' as const })),
  ].sort((a, b) => a.minute - b.minute);

  // Helper: get the running score just AFTER all goals up to and including `minute`
  const scoreAt = (minute: number) => {
    let sA = 0;
    let sB = 0;
    for (const g of allGoals) {
      if (g.minute <= minute) {
        if (g.team === 'A') sA++;
        else sB++;
      }
    }
    return { sA, sB };
  };

  // ── Step 1: Emit ALL goal events in chronological order with correct scores ──
  let runningA = 0;
  let runningB = 0;
  const goalMinutes = new Set(allGoals.map((g) => g.minute));

  // Kickoff (before any goals)
  state.events.push({
    minute: 0,
    type: 'normal',
    text: `${teamA.name} get the match underway against ${teamB.name}!`,
    scoreA: 0,
    scoreB: 0,
  });

  for (const goal of allGoals) {
    if (goal.team === 'A') runningA++;
    else runningB++;
    state.events.push({
      minute: goal.minute,
      type: 'goal',
      text: goalTemplates(
        goal.playerName,
        goal.assist,
        goal.team === 'A' ? teamA.name : teamB.name,
        !!goal.isPenalty
      ),
      scoreA: runningA,
      scoreB: runningB,
      goalScorerName: goal.playerName,
    });
  }

  // ── Step 2: Generate general event slots, skipping minutes too close to goals ──
  const eventSlots: number[] = [];
  const slots = [
    [3, 20],
    [21, 44],
    [46, 65],
    [66, 89],
  ];
  for (const [start, end] of slots) {
    const minutes = Array.from({ length: end - start + 1 }, (_, i) => i + start);
    eventSlots.push(...rng.shuffle(minutes).slice(0, 3 + rng.int(3)));
  }

  for (const minute of eventSlots.sort((a, b) => a - b)) {
    // Skip this slot if a goal happened within ±2 minutes
    if ([...goalMinutes].some((gm) => Math.abs(gm - minute) <= 2)) continue;

    const { sA, sB } = scoreAt(minute);
    const isForA = rng.next() > 0.5;
    const attTeam = isForA ? teamA : teamB;
    const defTeam = isForA ? teamB : teamA;
    const rand = rng.next();

    let text: string;
    if (rand < 0.35) {
      text = chanceTemplates(
        pickPlayer(attTeam, 'FW'),
        pickPlayer(attTeam, 'MF'),
        getKeeper(defTeam),
        attTeam.name,
        defTeam.name
      );
    } else if (rand < 0.6) {
      const skillEvent = generateSkillEvent(rng, isForA ? teamA : teamB, state, isForA);
      if (skillEvent) {
        skillEvent.minute = minute;
        skillEvent.scoreA = sA;
        skillEvent.scoreB = sB;
        state.events.push(skillEvent);
        continue;
      }
      text = generalTemplates(
        pickPlayer(attTeam, 'MF'),
        pickPlayer(attTeam, 'FW'),
        pickPlayer(defTeam, 'DF'),
        attTeam.name,
        defTeam.name
      );
    } else {
      text = generalTemplates(
        pickPlayer(attTeam, 'MF'),
        pickPlayer(attTeam, 'FW'),
        pickPlayer(defTeam, 'DF'),
        attTeam.name,
        defTeam.name
      );
    }

    state.events.push({ minute, type: 'normal', text, scoreA: sA, scoreB: sB });
  }

  // ── Step 3: Half time & Full time ──
  const htScore = scoreAt(45);
  const htLeader =
    htScore.sA > htScore.sB ? teamA.name : htScore.sB > htScore.sA ? teamB.name : null;
  const htComment = htLeader
    ? `${htLeader} have done well to take the lead. Their opponents need to respond.`
    : 'Both teams level — plenty to play for in the second half.';
  state.events.push({
    minute: 45,
    type: 'normal',
    text: `HALF TIME: ${teamA.name} ${htScore.sA} - ${htScore.sB} ${teamB.name}. ${htComment}`,
    scoreA: htScore.sA,
    scoreB: htScore.sB,
  });

  const winner = scoreA > scoreB ? teamA.name : scoreB > scoreA ? teamB.name : null;
  const margin = Math.abs(scoreA - scoreB);
  const ftComment = !winner
    ? 'A hard-fought draw — both teams can take credit from this.'
    : margin === 1
      ? `A narrow victory for ${winner} — a real battle from start to finish.`
      : margin === 2
        ? `${winner} were the better side today. A deserved victory.`
        : `${winner} were dominant today — a convincing win!`;
  state.events.push({
    minute: 90,
    type: 'normal',
    text: `FULL TIME: ${teamA.name} ${scoreA} - ${scoreB} ${teamB.name}. ${ftComment}`,
    scoreA,
    scoreB,
  });

  // Man of the match: scorer with most goals, else highest involvement.
  //
  // The involvement branch prefers an outfield player, but must not assume one
  // exists: every classic team has exactly one keeper, so this was unreachable,
  // while a user-assembled XI can legitimately field none and `reduce` on the
  // empty filter result throws.
  const involvementSide = scoreA >= scoreB ? teamA : teamB;
  const outfield = involvementSide.players.filter((p: EnginePlayer) => p.position !== 'GK');
  const involvementPool = outfield.length > 0 ? outfield : involvementSide.players;
  const manOfMatch =
    goalsA.length > 0
      ? goalsA[goalsA.length - 1].playerName
      : goalsB.length > 0
        ? goalsB[goalsB.length - 1].playerName
        : involvementPool.length > 0
          ? involvementPool.reduce((best, p) => (p.overallRating > best.overallRating ? p : best))
              .name
          : 'Unknown';

  // Summary commentary
  const summaryLines = [
    `${teamA.name} ${scoreA} - ${scoreB} ${teamB.name}`,
    ftComment,
    `Man of the Match: ${manOfMatch}`,
    `Shots: ${shotsA} (${teamA.name}) vs ${shotsB} (${teamB.name})`,
  ];

  const playerStatsAObj: { [key: string]: PlayerStats } = {};
  state.playerStatsA.forEach((s, name) => {
    playerStatsAObj[name] = s;
  });
  const playerStatsBObj: { [key: string]: PlayerStats } = {};
  state.playerStatsB.forEach((s, name) => {
    playerStatsBObj[name] = s;
  });

  const stadiums = [
    'Old Trafford',
    'Anfield',
    'Wembley',
    'Camp Nou',
    'Maracanã',
    'San Siro',
    'Santiago Bernabéu',
    'Estadio da Luz',
  ];

  return {
    scoreA,
    scoreB,
    goalsA,
    goalsB,
    stats: {
      shotsA,
      shotsB,
      shotsOnTargetA: Math.max(scoreA, Math.floor(shotsA / 2)),
      shotsOnTargetB: Math.max(scoreB, Math.floor(shotsB / 2)),
      possessionA: possessionAFinal,
      possessionB: 100 - possessionAFinal,
    },
    commentary: summaryLines,
    stadiumName: rng.pick(stadiums),
    kickOffTime: `${15 + rng.int(5)}:${rng.next() > 0.5 ? '00' : '30'}`,
    manOfTheMatch: manOfMatch,
    events: state.events.sort((a, b) => a.minute - b.minute || (a.type === 'goal' ? -1 : 1)),
    playerStatsA: playerStatsAObj,
    playerStatsB: playerStatsBObj,
  };
}
