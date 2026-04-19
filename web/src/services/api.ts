import { Team, TeamSummary, MatchResult } from '../types';

// Cache for loaded data
let cachedTeamsData: { clubs: any[]; teams: Team[] } | null = null;

async function loadTeamsDataFromFile(): Promise<{ clubs: any[]; teams: Team[] }> {
  if (cachedTeamsData) {
    console.log('Using cached teams data');
    return cachedTeamsData;
  }

  console.log('Loading teams data from JSON file...');
  try {
    const response = await fetch('/teams-data.json');
    if (!response.ok) {
      throw new Error(`Failed to load teams data: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    console.log('Teams data loaded successfully:', data);
    cachedTeamsData = data;
    return cachedTeamsData as { clubs: any[]; teams: Team[] };
  } catch (error) {
    console.error('Error loading teams data:', error);
    throw error;
  }
}

export const api = {
  async getTeams(): Promise<TeamSummary[]> {
    console.log('getTeams() called');
    const data = await loadTeamsDataFromFile();
    const result = data.teams.map(team => ({
      id: team.id,
      name: team.name,
      clubId: team.clubId,
      year: team.year,
      playerCount: team.players.length
    }));
    console.log('Returning teams:', result);
    return result;
  },

  async getTeam(id: string): Promise<Team> {
    console.log('getTeam() called with id:', id);
    const data = await loadTeamsDataFromFile();
    const team = data.teams.find(t => t.id === id);
    if (!team) {
      throw new Error(`Team with ID ${id} not found`);
    }
    console.log('Found team:', team);
    return team;
  },

  async simulateMatch(
    teamAId: string,
    teamBId: string,
    normaliseEra: boolean = false
  ): Promise<MatchResult> {
    console.log('simulateMatch() called with teams:', { teamAId, teamBId });
    const data = await loadTeamsDataFromFile();
    const teamA = data.teams.find(t => t.id === teamAId);
    const teamB = data.teams.find(t => t.id === teamBId);
    if (!teamA || !teamB) {
      throw new Error('One or both teams not found');
    }
    return generateMockMatchResult(teamAId, teamBId, teamA, teamB);
  }
};

function generateMockMatchResult(teamAId: string, teamBId: string, teamA: Team, teamB: Team): MatchResult {
  // Helper function to map specific positions to role categories
  const getPositionCategory = (pos: string): 'FW' | 'MF' | 'DF' | 'GK' => {
    const position = pos.toUpperCase();

    // Forwards/Strikers
    if (['FW', 'ST', 'CF', 'LW', 'RW', 'CAM'].includes(position)) {
      return 'FW';
    }
    // Midfielders
    if (['MF', 'CM', 'RM', 'LM', 'CDM', 'CAM'].includes(position)) {
      return position === 'CAM' ? 'FW' : 'MF'; // CAM leans toward forward
    }
    // Defenders
    if (['DF', 'CB', 'RB', 'LB', 'RWB', 'LWB'].includes(position)) {
      return 'DF';
    }
    // Goalkeeper
    if (position === 'GK') {
      return 'GK';
    }

    // Default to midfielder for unknown positions
    return 'MF';
  };

  // Helper function to select a goal scorer based on position weighting
  const selectGoalScorer = (team: Team): string => {
    // Position weights for goal scoring probability
    // FW (Striker/Forward) > Midfielder > Defender > GK
    const weights: { [key: string]: number } = {
      'FW': 0.50,  // Forwards/Strikers score 50% of the time
      'MF': 0.25,  // Midfielders score 25% of the time
      'DF': 0.15,  // Defenders score 15% of the time
      'GK': 0.00   // Goalkeepers never score
    };

    let playersWithWeights = team.players
      .filter(p => p.position !== 'GK')
      .map(p => {
        const category = getPositionCategory(p.position);
        return {
          name: p.name,
          position: p.position,
          category: category,
          weight: weights[category] || 0
        };
      });

    // Normalize weights
    const totalWeight = playersWithWeights.reduce((sum, p) => sum + p.weight, 0);

    if (totalWeight === 0) {
      // Fallback if no weights are assigned
      return playersWithWeights[0]?.name || team.players[0].name;
    }

    const rand = Math.random() * totalWeight;
    let cumulative = 0;

    for (const player of playersWithWeights) {
      cumulative += player.weight;
      if (rand <= cumulative) {
        return player.name;
      }
    }

    // Fallback to first non-GK player
    return playersWithWeights[0]?.name || team.players[0].name;
  };

  // Helper function to select an assister based on position weighting
  const selectAssister = (team: Team, goalScorerName: string): string | undefined => {
    // Position weights for assists
    // Midfielder/Winger > Striker > Defender > GK
    const weights: { [key: string]: number } = {
      'MF': 0.45,  // Midfielders assist 45% of the time
      'FW': 0.30,  // Forwards assist 30% of the time
      'DF': 0.20,  // Defenders assist 20% of the time
      'GK': 0.05   // GK rarely assist
    };

    let playersWithWeights = team.players
      .filter(p => p.name !== goalScorerName && p.position !== 'GK')
      .map(p => {
        const category = getPositionCategory(p.position);
        return {
          name: p.name,
          position: p.position,
          weight: weights[category] || 0
        };
      });

    if (playersWithWeights.length === 0) {
      return undefined;
    }

    // Normalize weights
    const totalWeight = playersWithWeights.reduce((sum, p) => sum + p.weight, 0);
    const rand = Math.random() * totalWeight;
    let cumulative = 0;

    for (const player of playersWithWeights) {
      cumulative += player.weight;
      if (rand <= cumulative) {
        return player.name;
      }
    }

    return playersWithWeights[0]?.name;
  };
  // Generate more realistic match results
  const possessionA = 35 + Math.random() * 30;
  const possessionB = 100 - possessionA;

  // Higher chance of scoring when team has more possession
  const possessionFactorA = (possessionA - 50) / 50;
  const possessionFactorB = (possessionB - 50) / 50;

  // More realistic score distribution (0-3 goals per team most common)
  const baseChanceA = 0.6 + possessionFactorA * 0.2;
  const baseChanceB = 0.6 + possessionFactorB * 0.2;

  const scoreA = Math.random() < baseChanceA ? (Math.random() < 0.4 ? 1 : Math.random() < 0.7 ? 2 : 3) : 0;
  const scoreB = Math.random() < baseChanceB ? (Math.random() < 0.4 ? 1 : Math.random() < 0.7 ? 2 : 3) : 0;

  const shotsA = 8 + Math.floor(Math.random() * 12);
  const shotsB = 8 + Math.floor(Math.random() * 12);

  // Get minute-appropriate commentary based on match phase
  const getCommentaryForMinute = (minute: number): string => {
    let templates: (string | ((team: string) => string))[];

    if (minute <= 15) {
      // Early match - opening play
      templates = [
        'What an incredible start to the match!',
        'Both teams are playing at a high tempo.',
        'Great intensity shown by both sides early on.',
        (team: string) => `${team} looking sharp in the opening minutes.`,
      ];
    } else if (minute <= 45) {
      // First half - developing play
      templates = [
        'Fantastic display of skill from both sides.',
        (team: string) => `${team}'s midfield is controlling the pace of the game.`,
        (team: string) => `Great defensive work being shown here by ${team}.`,
        'Chances are coming thick and fast.',
        (team: string) => `Brilliant passing move down the wing from ${team}.`,
        (team: string) => `Solid defending from ${team} preventing scoring opportunities.`,
      ];
    } else if (minute <= 75) {
      // Second half early - increased intensity
      templates = [
        'The intensity is building as the match progresses.',
        'Both keepers making important saves.',
        (team: string) => `Excellent work rate from ${team}!`,
        'This is end-to-end football at its finest!',
        (team: string) => `${team} pressing hard in search of a goal.`,
        'The match is reaching a critical phase.',
      ];
    } else {
      // Final stages - desperate play
      templates = [
        'This is end-to-end football at its finest!',
        (team: string) => `${team} pushing hard for a late goal.`,
        'Dramatic finish emerging as the clock ticks down.',
        (team: string) => `Superb effort from ${team} to stay competitive.`,
        'Every ball is being fought for intensely.',
        'The final stages are crucial for both teams.',
      ];
    }

    const selectedTemplate = templates[Math.floor(Math.random() * templates.length)];
    if (typeof selectedTemplate === 'function') {
      const team = Math.random() > 0.5 ? teamA.name : teamB.name;
      return selectedTemplate(team);
    }
    return selectedTemplate;
  };

  // Generate events (goals + match events)
  const events: any[] = [];

  // Add goal events
  const goalEventsA: any[] = [];
  for (let i = 0; i < scoreA; i++) {
    const minute = 15 + Math.floor(Math.random() * 70);
    const goalScorer = selectGoalScorer(teamA);
    const isPenalty = Math.random() > 0.9; // 10% chance of penalty
    const assister = !isPenalty && Math.random() > 0.3 ? selectAssister(teamA, goalScorer) : undefined;
    const penaltyText = isPenalty ? ' (PEN)' : '';

    goalEventsA.push({
      minute,
      type: 'goal',
      text: `⚽ GOAL! ${goalScorer} scores for Team A!${penaltyText}`,
      scoreA: i + 1,
      scoreB: scoreB,
      goalScorerName: goalScorer,
      assist: assister,
      isPenalty
    });
  }

  const goalEventsB: any[] = [];
  for (let i = 0; i < scoreB; i++) {
    const minute = 15 + Math.floor(Math.random() * 70);
    const goalScorer = selectGoalScorer(teamB);
    const isPenalty = Math.random() > 0.9; // 10% chance of penalty
    const assister = !isPenalty && Math.random() > 0.3 ? selectAssister(teamB, goalScorer) : undefined;
    const penaltyText = isPenalty ? ' (PEN)' : '';

    goalEventsB.push({
      minute,
      type: 'goal',
      text: `⚽ GOAL! ${goalScorer} scores for Team B!${penaltyText}`,
      scoreA: scoreA,
      scoreB: i + 1,
      goalScorerName: goalScorer,
      assist: assister,
      isPenalty
    });
  }

  // Add commentary events throughout the match with phase-appropriate commentary
  const commentaryEventMinutes = [5, 12, 25, 35, 45, 52, 65, 78, 88];
  const commentaryEvents = commentaryEventMinutes.map(minute => ({
    minute,
    type: 'normal',
    text: getCommentaryForMinute(minute),
    scoreA: scoreA,
    scoreB: scoreB
  }));

  // Combine all events
  events.push(...goalEventsA, ...goalEventsB, ...commentaryEvents);

  // Sort events by minute
  events.sort((a, b) => a.minute - b.minute);

  // Fix scores in goal events to be incremental based on order
  let currentScoreA = 0;
  let currentScoreB = 0;
  events.forEach(event => {
    if (event.type === 'goal') {
      if (event.text.includes('Team A')) {
        currentScoreA++;
      } else if (event.text.includes('Team B')) {
        currentScoreB++;
      }
      event.scoreA = currentScoreA;
      event.scoreB = currentScoreB;
    }
  });

  return {
    scoreA,
    scoreB,
    goalsA: goalEventsA.map(g => ({
      minute: g.minute,
      playerName: g.goalScorerName,
      teamId: teamAId,
      assist: g.assist,
      isPenalty: g.isPenalty
    })),
    goalsB: goalEventsB.map(g => ({
      minute: g.minute,
      playerName: g.goalScorerName,
      teamId: teamBId,
      assist: g.assist,
      isPenalty: g.isPenalty
    })),
    stats: {
      shotsA,
      shotsB,
      shotsOnTargetA: Math.floor(shotsA * (0.25 + Math.random() * 0.25)),
      shotsOnTargetB: Math.floor(shotsB * (0.25 + Math.random() * 0.25)),
      possessionA: Math.round(possessionA * 10) / 10,
      possessionB: Math.round(possessionB * 10) / 10
    },
    commentary: [
      getCommentaryForMinute(Math.floor(Math.random() * 90)),
      getCommentaryForMinute(Math.floor(Math.random() * 90)),
      getCommentaryForMinute(Math.floor(Math.random() * 90)),
      getCommentaryForMinute(Math.floor(Math.random() * 90)),
      getCommentaryForMinute(Math.floor(Math.random() * 90)),
      `Final Score: ${scoreA} - ${scoreB}. What a match!`
    ],
    stadiumName: 'Historic Stadium',
    kickOffTime: new Date().toLocaleTimeString(),
    manOfTheMatch: (Math.random() > 0.5 ? teamA : teamB).players[Math.floor(Math.random() * 11)].name,
    events
  };
}
