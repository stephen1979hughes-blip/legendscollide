import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Team, MatchResult } from '../types';

interface BroadcastState {
  matchResult: MatchResult;
  teamA: Team;
  teamB: Team;
}

const getPositionOrder = (position: string): number => {
  const order: { [key: string]: number } = {
    'GK': 0,
    'DF': 1,
    'CB': 1,
    'LB': 1,
    'RB': 1,
    'MF': 2,
    'CM': 2,
    'CAM': 2,
    'LM': 2,
    'RM': 2,
    'FW': 3,
    'ST': 3,
    'LW': 3,
    'RW': 3
  };
  return order[position] ?? 4;
};

const sortPlayersByPosition = (players: any[]): any[] => {
  return [...players].sort((a, b) => {
    const orderA = getPositionOrder(a.position);
    const orderB = getPositionOrder(b.position);
    return orderA - orderB;
  });
};

export const Broadcast: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as BroadcastState;

  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [visibleEventsCount, setVisibleEventsCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  if (
    !state ||
    !state.matchResult ||
    !state.teamA ||
    !state.teamB ||
    !state.teamA.players ||
    !state.teamB.players
  ) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-black via-black to-black/95">
        <Header showBack />
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <p className="text-muted mb-4">Invalid match data</p>
            <p className="text-sm text-red-500 mb-4">
              {!state && 'No navigation state'}
              {state && !state.matchResult && 'No match result'}
              {state && !state.teamA && 'No Team A'}
              {state && !state.teamB && 'No Team B'}
              {state && state.teamA && !state.teamA.players && `Team A missing players: ${JSON.stringify(Object.keys(state.teamA))}`}
              {state && state.teamB && !state.teamB.players && `Team B missing players: ${JSON.stringify(Object.keys(state.teamB))}`}
            </p>
            <button
              onClick={() => navigate('/')}
              className="btn-primary"
            >
              Back to Home
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const { matchResult, teamA, teamB } = state;

  // Memoize processed events and goals so they don't change on every render
  const { processedEvents, processedGoalsA, processedGoalsB, events } = useMemo(() => {
    // API already returns real player names, so just pass through the events
    const processed = (matchResult.events || []).map((event: any) => ({
      ...event,
      // Replace Team A/B with actual team names in display text
      text: event.text
        .replace(/Team A/g, teamA.name)
        .replace(/Team B/g, teamB.name)
    }));

    // Goals already have real player names from API
    const goalsA = (matchResult.goalsA || []).map((goal: any) => ({
      ...goal,
      assist: goal.isPenalty ? undefined : goal.assist
    }));

    const goalsB = (matchResult.goalsB || []).map((goal: any) => ({
      ...goal,
      assist: goal.isPenalty ? undefined : goal.assist
    }));

    return {
      processedEvents: processed,
      processedGoalsA: goalsA,
      processedGoalsB: goalsB,
      events: processed
    };
  }, [matchResult, teamA, teamB]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        const newTime = prev + (speed === 1 ? 1 : speed === 2 ? 2 : 0.5);
        // Count how many events should be visible at current time
        const count = events.filter((e) => e.minute <= newTime).length;
        setVisibleEventsCount(count);

        // Stop at 90 minutes
        if (newTime >= 90) {
          setIsPlaying(false);
          return 90;
        }
        return newTime;
      });
    }, 200 / speed); // Adjust speed by changing interval

    return () => clearInterval(interval);
  }, [isPlaying, speed, events]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setCurrentTime(0);
    setVisibleEventsCount(0);
    setIsPlaying(true);
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
  };

  const visibleEvents = events.slice(0, visibleEventsCount);
  const currentMatchTime = Math.floor(currentTime);
  const matchStatus =
    currentMatchTime < 45 ? 'FIRST HALF' : currentMatchTime < 90 ? 'SECOND HALF' : 'FULL TIME';

  // Calculate score from the LAST GOAL EVENT (not commentary events)
  const lastGoalEvent = visibleEvents
    .filter(e => e.type === 'goal')
    .slice(-1)[0];
  const scoreA = lastGoalEvent?.scoreA ?? 0;
  const scoreB = lastGoalEvent?.scoreB ?? 0;

  // Extract visible goal scorers from visible events
  // Track score progression to determine which team scored each goal
  const visibleGoalsA: any[] = [];
  const visibleGoalsB: any[] = [];
  const visibleCardsA: any[] = [];
  const visibleCardsB: any[] = [];
  let lastScoreA = 0;
  let lastScoreB = 0;

  visibleEvents.forEach(e => {
    if (e.type === 'goal') {
      // Try new format first, then fall back to old format
      let match = e.text.match(/GOAL! (.+?) scores!/);
      if (!match) {
        match = e.text.match(/GOAL! (.+?) scores for/);
      }
      const playerName = match ? match[1] : (e.goalScorer || e.goalScorerName || 'Unknown');
      const goal = {
        playerName,
        assist: e.assist,
        isPenalty: e.isPenalty,
        minute: e.minute
      };

      // Determine which team scored by comparing score changes
      if (e.scoreA !== undefined && e.scoreA > lastScoreA) {
        visibleGoalsA.push(goal);
        lastScoreA = e.scoreA;
      } else if (e.scoreB !== undefined && e.scoreB > lastScoreB) {
        visibleGoalsB.push(goal);
        lastScoreB = e.scoreB;
      }
    } else if (e.type === 'card') {
      const card = {
        playerName: e.playerName || 'Unknown',
        cardType: e.cardType || 'yellow',
        minute: e.minute
      };

      if (e.playerTeam === 'A') {
        visibleCardsA.push(card);
      } else if (e.playerTeam === 'B') {
        visibleCardsB.push(card);
      }
    }
  });

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-black via-black to-black/95">
      <Header showBack />

      <main className="flex-1 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Three column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Team A Lineup */}
            <div className="bg-white rounded-lg shadow p-6 order-3 lg:order-1">
              <Link to={`/team/${teamA.id}`} className="hover:opacity-80 transition">
                <h3 className="text-lg font-bold text-primary mb-2 hover:text-secondary transition">{teamA.name}</h3>
              </Link>
              <p className="text-sm text-muted mb-4">{teamA.year}</p>

              <div className="space-y-2">
                {sortPlayersByPosition(teamA.players).slice(0, 11).map((player) => (
                  <Link
                    key={player.id}
                    to={`/player/${player.id}`}
                    className="flex items-center justify-between p-2 rounded bg-gray-50 hover:bg-gray-100 text-sm transition"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-primary">{player.name}</p>
                      <p className="text-xs text-muted">{player.position}</p>
                    </div>
                    <p className="text-xs text-muted ml-2">{player.overallRating}</p>
                  </Link>
                ))}
              </div>
            </div>

            {/* Center: Broadcast */}
            <div className="bg-white/10 border border-white/20 backdrop-blur rounded-lg shadow p-6 lg:col-span-1 order-1 lg:order-2">
              {/* Match Time */}
              <div className="text-center mb-6 pb-6 border-b border-white/20">
                <div className="text-5xl font-bold text-white mb-2">{currentMatchTime}'</div>
                <div className="text-sm text-white/70 font-semibold uppercase">{matchStatus}</div>
              </div>

              {/* Score */}
              <div className="flex items-center justify-around mb-6 p-4 bg-white/10 rounded">
                <div className="text-center">
                  <p className="text-xs text-white/70 mb-1">{teamA.name}</p>
                  <p className="text-4xl font-bold text-white">{scoreA}</p>
                </div>
                <div className="text-white/30">—</div>
                <div className="text-center">
                  <p className="text-xs text-white/70 mb-1">{teamB.name}</p>
                  <p className="text-4xl font-bold text-white">{scoreB}</p>
                </div>
              </div>

              {/* Goal Scorers & Cards - Left and Right */}
              {(visibleGoalsA.length > 0 || visibleGoalsB.length > 0 || visibleCardsA.length > 0 || visibleCardsB.length > 0) && (
                <div className="flex justify-between gap-4 mb-6">
                  {/* Team A - Left */}
                  <div className="flex-1 space-y-2">
                    {/* Goals */}
                    {visibleGoalsA.length > 0 && (
                      <div className="bg-yellow-50 rounded p-3 border-l-4 border-secondary">
                        <div className="space-y-1 text-xs">
                          {visibleGoalsA.map((goal, idx) => (
                            <p key={idx} className="text-gray-700">
                              ⚽ {goal.playerName} {goal.isPenalty && '(PEN)'}
                              {goal.assist && <span className="block text-muted text-xs">Assist: {goal.assist}</span>}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Cards */}
                    {visibleCardsA.length > 0 && (
                      <div className="space-y-1">
                        {visibleCardsA.map((card, idx) => (
                          <div key={idx} className={`rounded p-2 text-xs font-semibold ${
                            card.cardType === 'red'
                              ? 'bg-red-100 border-l-4 border-red-500 text-red-700'
                              : 'bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700'
                          }`}>
                            {card.cardType === 'red' ? '🟥' : '🟨'} {card.playerName}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Team B - Right */}
                  <div className="flex-1 space-y-2">
                    {/* Goals */}
                    {visibleGoalsB.length > 0 && (
                      <div className="bg-yellow-50 rounded p-3 border-r-4 border-secondary">
                        <div className="space-y-1 text-xs text-right">
                          {visibleGoalsB.map((goal, idx) => (
                            <p key={idx} className="text-gray-700">
                              {goal.playerName} ⚽ {goal.isPenalty && '(PEN)'}
                              {goal.assist && <span className="block text-muted text-xs">Assist: {goal.assist}</span>}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Cards */}
                    {visibleCardsB.length > 0 && (
                      <div className="space-y-1">
                        {visibleCardsB.map((card, idx) => (
                          <div key={idx} className={`rounded p-2 text-xs font-semibold text-right ${
                            card.cardType === 'red'
                              ? 'bg-red-100 border-r-4 border-red-500 text-red-700'
                              : 'bg-yellow-100 border-r-4 border-yellow-500 text-yellow-700'
                          }`}>
                            {card.playerName} {card.cardType === 'red' ? '🔴' : '🟡'}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Commentary */}
              <div className="max-h-64 overflow-y-auto mb-6">
                <h4 className="text-xs font-semibold text-white/70 uppercase mb-3">Live Commentary</h4>
                <div className="space-y-2">
                  {visibleEvents.map((event, idx) => {
                    // Replace Team A/B with actual team names
                    let displayText = event.text;
                    if (event.scoreA !== undefined && event.scoreB !== undefined) {
                      displayText = event.text
                        .replace(/Team A/g, teamA.name)
                        .replace(/Team B/g, teamB.name);
                    }

                    const getEventIcon = (type: string) => {
                      switch(type) {
                        case 'goal': return '⚽';
                        case 'card':
                          return event.cardType === 'red' ? '🔴' : '🟡';
                        case 'skill':
                          switch(event.skillType) {
                            case 'save': return '🧤';
                            case 'tackle': return '🥊';
                            case 'dribble': return '🏃';
                            case 'pass': return '➡️';
                            default: return '⚪';
                          }
                        default: return '';
                      }
                    };

                    const getBgColor = (type: string) => {
                      switch(type) {
                        case 'goal': return 'border-secondary bg-yellow-500/20';
                        case 'card': return event.cardType === 'red' ? 'border-red-500 bg-red-500/20' : 'border-yellow-500 bg-yellow-500/20';
                        case 'skill': return 'border-blue-300 bg-blue-500/20';
                        case 'highlight': return 'border-primary bg-green-500/20';
                        default: return 'border-white/20 bg-white/10';
                      }
                    };

                    return (
                      <div
                        key={idx}
                        className={`p-2 rounded text-sm border-l-3 ${getBgColor(event.type)}`}
                      >
                        <span className="font-semibold text-white/60 text-xs mr-2">{event.minute}'</span>
                        <span className={`${event.type === 'goal' ? 'font-semibold' : ''} text-white/90`}>
                          {getEventIcon(event.type)} {displayText}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Controls */}
              <div className="space-y-3 pt-4 border-t border-white/20">
                {/* Full Time CTA */}
                {currentMatchTime >= 90 && (
                  <div className="text-center mb-3">
                    <p className="text-xs font-bold text-white/70 uppercase tracking-wide mb-2">Match Over</p>
                    <button
                      onClick={() => navigate('/result', {
                        state: {
                          result: matchResult,
                          teamAId: teamA.id,
                          teamBId: teamB.id,
                          teamA,
                          teamB
                        }
                      })}
                      className="w-full bg-secondary text-white font-bold py-3 rounded-lg hover:opacity-90 transition"
                    >
                      📋 View Match Report
                    </button>
                  </div>
                )}

                <div className="flex gap-2 justify-center">
                  <button
                    onClick={handlePlayPause}
                    disabled={currentMatchTime >= 90}
                    className={`px-4 py-2 rounded font-semibold text-sm transition ${
                      currentMatchTime >= 90
                        ? 'opacity-40 cursor-not-allowed bg-gray-100 text-gray-400'
                        : isPlaying
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-primary border border-primary'
                    }`}
                  >
                    {isPlaying ? '⏸ Pause' : '▶ Play'}
                  </button>
                  <button
                    onClick={() => handleSpeedChange(1)}
                    className={`px-3 py-2 rounded text-sm transition ${
                      speed === 1
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-text border border-gray-300'
                    }`}
                  >
                    1x
                  </button>
                  <button
                    onClick={() => handleSpeedChange(2)}
                    className={`px-3 py-2 rounded text-sm transition ${
                      speed === 2
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-text border border-gray-300'
                    }`}
                  >
                    2x
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 rounded font-semibold text-sm bg-gray-100 text-text border border-gray-300 hover:bg-gray-200"
                  >
                    Reset
                  </button>
                </div>
                <p className="text-xs text-white/60 text-center">
                  {visibleEventsCount} of {events.length} events shown
                </p>
              </div>
            </div>

            {/* Right: Team B Lineup */}
            <div className="bg-white rounded-lg shadow p-6 order-2 lg:order-3">
              <Link to={`/team/${teamB.id}`} className="hover:opacity-80 transition">
                <h3 className="text-lg font-bold text-primary mb-2 hover:text-secondary transition">{teamB.name}</h3>
              </Link>
              <p className="text-sm text-muted mb-4">{teamB.year}</p>

              <div className="space-y-2">
                {sortPlayersByPosition(teamB.players).slice(0, 11).map((player) => (
                  <Link
                    key={player.id}
                    to={`/player/${player.id}`}
                    className="flex items-center justify-between p-2 rounded bg-gray-50 hover:bg-gray-100 text-sm transition"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-primary">{player.name}</p>
                      <p className="text-xs text-muted">{player.position}</p>
                    </div>
                    <p className="text-xs text-muted ml-2">{player.overallRating}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
