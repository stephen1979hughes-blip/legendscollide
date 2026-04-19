import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Team, MatchResult } from '../types';

interface BroadcastState {
  matchResult: MatchResult;
  teamA: Team;
  teamB: Team;
}

export const Broadcast: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as BroadcastState;

  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [visibleEventsCount, setVisibleEventsCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  console.log('Broadcast: received state:', state);
  console.log('Broadcast: teamA:', state?.teamA);
  console.log('Broadcast: teamA.players:', state?.teamA?.players);
  console.log('Broadcast: teamB:', state?.teamB);
  console.log('Broadcast: teamB.players:', state?.teamB?.players);

  if (
    !state ||
    !state.matchResult ||
    !state.teamA ||
    !state.teamB ||
    !state.teamA.players ||
    !state.teamB.players
  ) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
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
    const goalsA = matchResult.goalsA.map((goal: any) => ({
      ...goal,
      assist: goal.isPenalty ? undefined : goal.assist
    }));

    const goalsB = matchResult.goalsB.map((goal: any) => ({
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

  // Extract visible goal scorers from visible events (to match commentary exactly)
  const visibleGoalsA = visibleEvents
    .filter(e => e.type === 'goal' && e.text.includes(teamA.name))
    .map(e => {
      // Extract player name from the event text (e.g., "⚽ GOAL! George Best scores for Manchester United 1968!")
      const match = e.text.match(/GOAL! (.+?) scores for/);
      return {
        playerName: match ? match[1] : (e.goalScorer || 'Unknown'),
        assist: e.assist,
        isPenalty: e.isPenalty,
        minute: e.minute
      };
    });

  const visibleGoalsB = visibleEvents
    .filter(e => e.type === 'goal' && e.text.includes(teamB.name))
    .map(e => {
      // Extract player name from the event text
      const match = e.text.match(/GOAL! (.+?) scores for/);
      return {
        playerName: match ? match[1] : (e.goalScorer || 'Unknown'),
        assist: e.assist,
        isPenalty: e.isPenalty,
        minute: e.minute
      };
    });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header showBack />

      <main className="flex-1 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Three column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Team A Lineup */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-primary mb-2">{teamA.name}</h3>
              <p className="text-sm text-muted mb-4">{teamA.year}</p>

              <div className="space-y-2">
                {teamA.players.slice(0, 11).map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-2 rounded bg-gray-50 hover:bg-gray-100 text-sm"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-primary">{player.name}</p>
                      <p className="text-xs text-muted">{player.position}</p>
                    </div>
                    <p className="text-xs text-muted ml-2">{player.overallRating}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Center: Broadcast */}
            <div className="bg-white rounded-lg shadow p-6 lg:col-span-1">
              {/* Match Time */}
              <div className="text-center mb-6 pb-6 border-b border-gray-200">
                <div className="text-5xl font-bold text-primary mb-2">{currentMatchTime}'</div>
                <div className="text-sm text-muted font-semibold uppercase">{matchStatus}</div>
              </div>

              {/* Score */}
              <div className="flex items-center justify-around mb-6 p-4 bg-gray-50 rounded">
                <div className="text-center">
                  <p className="text-xs text-muted mb-1">{teamA.name}</p>
                  <p className="text-4xl font-bold text-primary">{scoreA}</p>
                </div>
                <div className="text-gray-300">—</div>
                <div className="text-center">
                  <p className="text-xs text-muted mb-1">{teamB.name}</p>
                  <p className="text-4xl font-bold text-primary">{scoreB}</p>
                </div>
              </div>

              {/* Goal Scorers - Left and Right */}
              {(visibleGoalsA.length > 0 || visibleGoalsB.length > 0) && (
                <div className="flex justify-between gap-4 mb-6">
                  {/* Team A Goals - Left */}
                  {visibleGoalsA.length > 0 && (
                    <div className="flex-1">
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
                    </div>
                  )}
                  {visibleGoalsB.length > 0 && (
                    <div className="flex-1">
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
                    </div>
                  )}
                </div>
              )}

              {/* Commentary */}
              <div className="max-h-64 overflow-y-auto mb-6">
                <h4 className="text-xs font-semibold text-muted uppercase mb-3">Live Commentary</h4>
                <div className="space-y-2">
                  {visibleEvents.map((event, idx) => {
                    // Replace Team A/B with actual team names
                    let displayText = event.text;
                    if (event.scoreA !== undefined && event.scoreB !== undefined) {
                      displayText = event.text
                        .replace(/Team A/g, teamA.name)
                        .replace(/Team B/g, teamB.name);
                    }

                    return (
                      <div
                        key={idx}
                        className={`p-2 rounded text-sm border-l-3 ${
                          event.type === 'goal'
                            ? 'border-secondary bg-yellow-50'
                            : event.type === 'highlight'
                            ? 'border-primary bg-green-50'
                            : 'border-gray-300 bg-gray-50'
                        }`}
                      >
                        <span className="font-semibold text-gray-500 text-xs mr-2">{event.minute}'</span>
                        <span className={event.type === 'goal' ? 'font-semibold' : ''}>
                          {event.type === 'goal' && '⚽ '}
                          {displayText}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Controls */}
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={handlePlayPause}
                    className={`px-4 py-2 rounded font-semibold text-sm transition ${
                      isPlaying
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
                <p className="text-xs text-muted text-center">
                  {visibleEventsCount} of {events.length} events shown
                </p>
              </div>
            </div>

            {/* Right: Team B Lineup */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-primary mb-2">{teamB.name}</h3>
              <p className="text-sm text-muted mb-4">{teamB.year}</p>

              <div className="space-y-2">
                {teamB.players.slice(0, 11).map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-2 rounded bg-gray-50 hover:bg-gray-100 text-sm"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-primary">{player.name}</p>
                      <p className="text-xs text-muted">{player.position}</p>
                    </div>
                    <p className="text-xs text-muted ml-2">{player.overallRating}</p>
                  </div>
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
