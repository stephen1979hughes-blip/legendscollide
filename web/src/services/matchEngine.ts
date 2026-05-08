import { Team, MatchResult, MatchEvent, PlayerStats } from '../types';

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
  GK: {
    save: 0.40,
    punch: 0.15,
    clearance: 0.20,
  },
  DF: {
    tackle: 0.35,
    block: 0.30,
    clearance: 0.25,
  },
  MF: {
    tackle: 0.20,
    pass: 0.40,
    dribble: 0.25,
  },
  FW: {
    dribble: 0.35,
    pass: 0.30,
  },
};

const FOUL_PROBABILITIES = {
  GK: 0.02,
  DF: 0.08,
  MF: 0.06,
  FW: 0.04,
};

const CARD_ESCALATION = {
  first: 0.6, // 60% yellow card on first foul
  second: 0.8, // 80% yellow card on second foul (already has one)
  thirdWithYellow: 0.99, // 99% red card if has yellow + fouls again
};

function getPositionCategory(pos: string): 'FW' | 'MF' | 'DF' | 'GK' {
  const position = pos.toUpperCase();
  if (['GK'].includes(position)) return 'GK';
  if (['DF', 'CB', 'RB', 'LB', 'RWB', 'LWB'].includes(position)) return 'DF';
  if (['MF', 'CM', 'RM', 'LM', 'CDM', 'CAM'].includes(position)) return 'MF';
  if (['FW', 'ST', 'CF', 'LW', 'RW', 'CAM'].includes(position)) return 'FW';
  return 'MF';
}

function selectRandomPlayer(team: Team): string {
  return team.players[Math.floor(Math.random() * team.players.length)].name;
}

function selectPlayerByPosition(
  team: Team,
  position: 'GK' | 'DF' | 'MF' | 'FW'
): string {
  const candidates = team.players.filter(p => {
    const cat = getPositionCategory(p.position);
    return cat === position;
  });
  if (candidates.length === 0) return selectRandomPlayer(team);
  return candidates[Math.floor(Math.random() * candidates.length)].name;
}

function initializePlayerStats(team: Team): Map<string, PlayerStats> {
  const stats = new Map<string, PlayerStats>();
  team.players.forEach(player => {
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

function initializeCardState(team: Team): Map<string, PlayerCardState> {
  const cards = new Map<string, PlayerCardState>();
  team.players.forEach(player => {
    cards.set(player.name, {
      yellowCards: 0,
      redCards: 0,
      ejected: false,
    });
  });
  return cards;
}

function generateSkillEvent(
  team: Team,
  state: MatchSimulationState,
  isTeamA: boolean
): MatchEvent | null {
  const positionCategories: Array<'GK' | 'DF' | 'MF' | 'FW'> = ['GK', 'DF', 'MF', 'FW'];
  const position = positionCategories[Math.floor(Math.random() * positionCategories.length)];

  const playerName = selectPlayerByPosition(team, position);
  const stats = isTeamA ? state.playerStatsA : state.playerStatsB;
  const playerStats = stats.get(playerName);
  if (!playerStats) return null;

  const weights = SKILL_EVENT_WEIGHTS[position] as Record<string, number>;
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  const rand = Math.random() * totalWeight;

  let cumulative = 0;
  let skillType: 'tackle' | 'block' | 'clearance' | 'dribble' | 'pass' | 'save' | 'punch' | 'block' = 'pass';

  for (const [skill, weight] of Object.entries(weights)) {
    cumulative += weight;
    if (rand <= cumulative) {
      skillType = skill as any;
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

  const descriptions = skillDescriptions[skillType];
  const text = descriptions[Math.floor(Math.random() * descriptions.length)];

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

function generateFoulEvent(
  team: Team,
  state: MatchSimulationState,
  isTeamA: boolean,
  minute: number
): MatchEvent | null {
  const candidates = team.players.filter(p => {
    const cards = isTeamA ? state.playerCardsA : state.playerCardsB;
    const cardState = cards.get(p.name);
    return cardState && !cardState.ejected;
  });

  if (candidates.length === 0) return null;

  const playerName = candidates[Math.floor(Math.random() * candidates.length)].name;
  const cards = isTeamA ? state.playerCardsA : state.playerCardsB;
  const cardState = cards.get(playerName)!;
  const stats = isTeamA ? state.playerStatsA : state.playerStatsB;
  const playerStats = stats.get(playerName);

  if (!playerStats) return null;

  let cardType: 'yellow' | 'red' | null = null;

  if (cardState.redCards > 0) {
    return null; // Player already ejected
  }

  if (cardState.yellowCards === 0) {
    if (Math.random() < CARD_ESCALATION.first) {
      cardType = 'yellow';
      cardState.yellowCards++;
      playerStats.yellowCards++;
    }
  } else if (cardState.yellowCards === 1 && cardState.redCards === 0) {
    if (Math.random() < CARD_ESCALATION.thirdWithYellow) {
      cardType = 'red';
      cardState.redCards++;
      cardState.ejected = true;
      playerStats.redCards++;
    } else if (Math.random() < CARD_ESCALATION.second) {
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

function calcTeamAttack(team: Team): number {
  const fwd = team.players.filter(p => getPositionCategory(p.position) === 'FW');
  const mid = team.players.filter(p => getPositionCategory(p.position) === 'MF');
  const pool = fwd.length > 0 ? [...fwd, ...mid] : mid;
  if (pool.length === 0) return 70;
  return pool.reduce((s, p) => s + p.attackRating, 0) / pool.length;
}

function calcTeamDefence(team: Team): number {
  const def = team.players.filter(p => getPositionCategory(p.position) === 'DF');
  const mid = team.players.filter(p => getPositionCategory(p.position) === 'MF');
  const pool = def.length > 0 ? [...def, ...mid] : mid;
  if (pool.length === 0) return 70;
  return pool.reduce((s, p) => s + p.defenceRating, 0) / pool.length;
}

function calcChances(attack: number, defence: number): number {
  const base = 8;
  const diff = attack - defence;
  const raw = base + diff * 0.05 + (Math.random() * 4 - 2);
  return Math.max(2, Math.min(15, Math.round(raw)));
}

function simulateGoalsFromChances(
  chances: number,
  conversionRate: number,
  team: Team,
  teamId: string
): Array<{ minute: number; playerName: string; teamId: string; assist?: string; isPenalty?: boolean }> {
  // Build a weighted scorer pool:
  //   FW  → full attackRating weight  (primary scorers)
  //   MF  → 30% of attackRating       (midfield contributions)
  //   DF  → 5%  of attackRating       (rare set-piece headers)
  //   GK  → 0 (never scores in normal play)
  interface WeightedPlayer { name: string; weight: number }
  const weightedPool: WeightedPlayer[] = [];

  for (const p of team.players) {
    const cat = getPositionCategory(p.position);
    const mult = cat === 'FW' ? 1.0 : cat === 'MF' ? 0.3 : cat === 'DF' ? 0.05 : 0;
    if (mult > 0) {
      weightedPool.push({ name: p.name, weight: p.attackRating * mult });
    }
  }

  const totalWeight = weightedPool.reduce((s, wp) => s + wp.weight, 0) || 1;

  // Assist pool: midfielders, fallback to full squad
  const midPool = team.players.filter(p => getPositionCategory(p.position) === 'MF');
  const assistPool = midPool.length > 0 ? midPool : team.players;

  const pickScorer = (): string => {
    let rand = Math.random() * totalWeight;
    for (const wp of weightedPool) {
      rand -= wp.weight;
      if (rand <= 0) return wp.name;
    }
    return weightedPool[weightedPool.length - 1].name;
  };

  const goals: Array<{ minute: number; playerName: string; teamId: string; assist?: string; isPenalty?: boolean }> = [];
  for (let i = 0; i < chances; i++) {
    if (Math.random() < conversionRate) {
      const scorerName = pickScorer();
      const isPenalty = Math.random() > 0.92;
      const hasAssist = !isPenalty && Math.random() > 0.35;
      const assister = hasAssist
        ? assistPool.filter(p => p.name !== scorerName)[Math.floor(Math.random() * assistPool.length)]?.name
        : undefined;
      goals.push({
        minute: 10 + Math.floor(Math.random() * 80),
        playerName: scorerName,
        teamId,
        assist: assister,
        isPenalty,
      });
    }
  }
  return goals.sort((a, b) => a.minute - b.minute);
}

export function simulateRealisticMatch(
  teamAId: string,
  teamBId: string,
  teamA: Team,
  teamB: Team
): MatchResult {
  // Rating-based simulation
  const attackA = calcTeamAttack(teamA);
  const defenceA = calcTeamDefence(teamA);
  const attackB = calcTeamAttack(teamB);
  const defenceB = calcTeamDefence(teamB);

  const chancesA = calcChances(attackA, defenceB);
  const chancesB = calcChances(attackB, defenceA);

  let convRateA = Math.max(0.10, Math.min(0.30, 0.20 + (attackA - defenceB) / 1000));
  let convRateB = Math.max(0.10, Math.min(0.30, 0.20 + (attackB - defenceA) / 1000));

  const goalsA = simulateGoalsFromChances(chancesA, convRateA, teamA, teamAId);
  const goalsB = simulateGoalsFromChances(chancesB, convRateB, teamB, teamBId);

  const scoreA = goalsA.length;
  const scoreB = goalsB.length;

  const teamStrA = attackA + defenceA;
  const teamStrB = attackB + defenceB;
  const totalStr = teamStrA + teamStrB || 1;
  const possessionA = Math.round(50 + (teamStrA - teamStrB) / (totalStr * 0.04));
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
  const goalTemplates = (scorer: string, assist: string | undefined, teamName: string, isPenalty: boolean) => {
    if (isPenalty) return `GOAL! ${scorer} steps up and converts the penalty for ${teamName}!`;
    const assistStr = assist ? ` ${assist} plays it through and ` : ' ';
    const opts = [
      `GOAL! ${teamName}!${assistStr}${scorer} slots it home into the bottom corner!`,
      `GOAL! What a strike from ${scorer}! A powerful effort leaves the keeper with no chance!`,
      `GOAL! ${scorer} is unmarked at the far post!${assistStr}He heads it firmly into the net!`,
      `GOAL! ${scorer} latches onto the through ball and finishes clinically!`,
      `GOAL! A brilliant individual effort from ${scorer} — he beats two defenders and fires home!`,
      `GOAL! ${scorer} cuts inside and unleashes a curling shot into the top corner!`,
      `GOAL! ${scorer} taps in from close range after a flowing ${teamName} move!`,
    ];
    return opts[Math.floor(Math.random() * opts.length)];
  };

  const chanceTemplates = (attackerName: string, midName: string, keeperName: string, teamName: string, oppName: string) => {
    const opts = [
      `${attackerName} drives into the box but ${keeperName} stands firm to smother the shot!`,
      `Great move from ${teamName}! ${midName} slips in ${attackerName} but the shot goes just wide.`,
      `A stunning save! ${attackerName} looked certain to score before ${keeperName} tipped it over the bar.`,
      `${midName} drives forward and unleashes a long-range effort — wide of the post.`,
      `${attackerName} is clean through on goal but ${keeperName} makes himself big and blocks!`,
      `Corner for ${teamName}. ${midName} whips it in but the ${oppName} defence clears.`,
      `Free kick on the edge of the box. ${midName} curls it over the wall but it's saved!`,
    ];
    return opts[Math.floor(Math.random() * opts.length)];
  };

  const generalTemplates = (midName: string, attackerName: string, defName: string, teamName: string, oppName: string) => {
    const opts = [
      `${midName} drives forward from midfield, linking up with ${attackerName} in a promising position.`,
      `Good pressing from ${teamName} — ${midName} wins the ball back in their own half.`,
      `${attackerName} holds up the ball well, bringing ${midName} into play.`,
      `${defName} makes a crucial interception to deny ${oppName} a clear opening.`,
      `A creative ball from ${midName} almost breaks through the ${oppName} defence.`,
      `${teamName} winning the midfield battle through hard work from ${midName}.`,
      `Excellent defensive work from ${defName}, clearing the danger with a well-timed tackle.`,
    ];
    return opts[Math.floor(Math.random() * opts.length)];
  };

  const pickPlayer = (team: Team, pos: string): string => {
    const pool = team.players.filter(p => getPositionCategory(p.position) === pos);
    const fallback = team.players.filter(p => getPositionCategory(p.position) === 'MF');
    const src = pool.length > 0 ? pool : (fallback.length > 0 ? fallback : team.players);
    return src[Math.floor(Math.random() * src.length)].name;
  };

  const getKeeper = (team: Team) => {
    const gk = team.players.find(p => p.position === 'GK');
    return gk?.name ?? 'the keeper';
  };

  // All goals sorted chronologically
  const allGoals = [
    ...goalsA.map(g => ({ ...g, team: 'A' as const })),
    ...goalsB.map(g => ({ ...g, team: 'B' as const })),
  ].sort((a, b) => a.minute - b.minute);

  // Helper: get the running score just AFTER all goals up to and including `minute`
  const scoreAt = (minute: number) => {
    let sA = 0, sB = 0;
    for (const g of allGoals) {
      if (g.minute <= minute) { if (g.team === 'A') sA++; else sB++; }
    }
    return { sA, sB };
  };

  // ── Step 1: Emit ALL goal events in chronological order with correct scores ──
  let runningA = 0;
  let runningB = 0;
  const goalMinutes = new Set(allGoals.map(g => g.minute));

  // Kickoff (before any goals)
  state.events.push({
    minute: 0,
    type: 'normal',
    text: `${teamA.name} get the match underway against ${teamB.name}!`,
    scoreA: 0,
    scoreB: 0,
  });

  for (const goal of allGoals) {
    if (goal.team === 'A') runningA++; else runningB++;
    state.events.push({
      minute: goal.minute,
      type: 'goal',
      text: goalTemplates(goal.playerName, goal.assist, goal.team === 'A' ? teamA.name : teamB.name, !!goal.isPenalty),
      scoreA: runningA,
      scoreB: runningB,
      goalScorerName: goal.playerName,
    });
  }

  // ── Step 2: Generate general event slots, skipping minutes too close to goals ──
  const eventSlots: number[] = [];
  const slots = [[3, 20], [21, 44], [46, 65], [66, 89]];
  for (const [start, end] of slots) {
    const available = Array.from({ length: end - start + 1 }, (_, i) => i + start)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3 + Math.floor(Math.random() * 3));
    eventSlots.push(...available);
  }

  for (const minute of eventSlots.sort((a, b) => a - b)) {
    // Skip this slot if a goal happened within ±2 minutes
    if ([...goalMinutes].some(gm => Math.abs(gm - minute) <= 2)) continue;

    const { sA, sB } = scoreAt(minute);
    const isForA = Math.random() > 0.5;
    const attTeam = isForA ? teamA : teamB;
    const defTeam = isForA ? teamB : teamA;
    const rand = Math.random();

    let text: string;
    if (rand < 0.35) {
      text = chanceTemplates(
        pickPlayer(attTeam, 'FW'),
        pickPlayer(attTeam, 'MF'),
        getKeeper(defTeam),
        attTeam.name,
        defTeam.name
      );
    } else if (rand < 0.60) {
      const skillEvent = generateSkillEvent(isForA ? teamA : teamB, state, isForA);
      if (skillEvent) {
        skillEvent.minute = minute;
        skillEvent.scoreA = sA;
        skillEvent.scoreB = sB;
        state.events.push(skillEvent);
        continue;
      }
      text = generalTemplates(pickPlayer(attTeam, 'MF'), pickPlayer(attTeam, 'FW'), pickPlayer(defTeam, 'DF'), attTeam.name, defTeam.name);
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
  const htLeader = htScore.sA > htScore.sB ? teamA.name : htScore.sB > htScore.sA ? teamB.name : null;
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

  // Man of the match: scorer with most goals, else highest involvement
  let manOfMatch = goalsA.length > 0
    ? goalsA[goalsA.length - 1].playerName
    : goalsB.length > 0
    ? goalsB[goalsB.length - 1].playerName
    : (scoreA >= scoreB ? teamA : teamB).players
        .filter(p => p.position !== 'GK')
        .reduce((best, p) => p.overallRating > best.overallRating ? p : best).name;

  // Summary commentary
  const summaryLines = [
    `${teamA.name} ${scoreA} - ${scoreB} ${teamB.name}`,
    ftComment,
    `Man of the Match: ${manOfMatch}`,
    `Shots: ${shotsA} (${teamA.name}) vs ${shotsB} (${teamB.name})`,
  ];

  const playerStatsAObj: { [key: string]: PlayerStats } = {};
  state.playerStatsA.forEach((s, name) => { playerStatsAObj[name] = s; });
  const playerStatsBObj: { [key: string]: PlayerStats } = {};
  state.playerStatsB.forEach((s, name) => { playerStatsBObj[name] = s; });

  const stadiums = ['Old Trafford', 'Anfield', 'Wembley', 'Camp Nou', 'Maracanã', 'San Siro', 'Santiago Bernabéu', 'Estadio da Luz'];

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
    stadiumName: stadiums[Math.floor(Math.random() * stadiums.length)],
    kickOffTime: `${15 + Math.floor(Math.random() * 5)}:${Math.random() > 0.5 ? '00' : '30'}`,
    manOfTheMatch: manOfMatch,
    events: state.events.sort((a, b) => a.minute - b.minute || (a.type === 'goal' ? -1 : 1)),
    playerStatsA: playerStatsAObj,
    playerStatsB: playerStatsBObj,
  };
}
