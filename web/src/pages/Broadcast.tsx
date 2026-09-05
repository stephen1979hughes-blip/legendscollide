import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Icon, IconName } from '../components/Icon';
import { Team, MatchResult, Player } from '../types';

interface BroadcastState {
  matchResult: MatchResult;
  teamA: Team;
  teamB: Team;
  /** Where "full time" should lead. Defaults to the generic /result flow. */
  completeRoute?: string;
  completeState?: unknown;
  completeLabel?: string;
}

const getPositionOrder = (position: string): number => {
  const order: { [key: string]: number } = {
    'GK': 0,
    'DF': 1, 'CB': 1, 'LB': 1, 'RB': 1,
    'MF': 2, 'CM': 2, 'CAM': 2, 'LM': 2, 'RM': 2,
    'FW': 3, 'ST': 3, 'LW': 3, 'RW': 3
  };
  return order[position] ?? 4;
};

const sortPlayersByPosition = (players: any[]): any[] =>
  [...players].sort((a, b) => getPositionOrder(a.position) - getPositionOrder(b.position));

/**
 * A team's XI down the side of the broadcast. These were the one place in the
 * app that stayed white-on-black mid-flow, which made the live screen look
 * like a different product from every screen either side of it.
 */
const LineupColumn: React.FC<{ team: Team; className?: string }> = ({ team, className }) => (
  <div className={`panel h-fit p-5 ${className ?? ''}`}>
    <Link to={`/team/${team.id}`} className="group block rounded">
      <h2 className="display text-lg transition-colors group-hover:text-accent">{team.name}</h2>
      <p className="num text-xs text-ink-3">{team.year}</p>
    </Link>

    <div className="mt-4 space-y-0">
      {sortPlayersByPosition(team.players).slice(0, 11).map((player: Player) => (
        <Link
          key={player.id}
          to={`/player/${player.id}`}
          className="flex items-center gap-3 border-b border-line py-2 last:border-b-0 hover:text-accent"
        >
          <span className="num inset w-8 flex-shrink-0 py-0.5 text-center text-[10px] font-semibold uppercase tracking-wider text-ink-2">
            {player.position}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm text-ink transition-colors hover:text-accent">
            {player.name}
          </span>
          <span className="num flex-shrink-0 text-xs font-semibold text-ink-2">
            {player.overallRating}
          </span>
        </Link>
      ))}
    </div>
  </div>
);

export const Broadcast: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as BroadcastState;

  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [visibleEventsCount, setVisibleEventsCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const valid =
    state && state.matchResult && state.teamA && state.teamB &&
    state.teamA.players && state.teamB.players;

  // Memoize processed events and goals so they don't change on every render.
  // Hooks must run unconditionally, so this sits above the invalid-state guard.
  const events = useMemo(() => {
    if (!valid) return [];
    // API already returns real player names, so just pass through the events
    return (state.matchResult.events || []).map((event: any) => ({
      ...event,
      // Replace Team A/B with actual team names in display text
      text: event.text
        .replace(/Team A/g, state.teamA.name)
        .replace(/Team B/g, state.teamB.name),
    }));
  }, [valid, state]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying || !valid) return;

    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        const newTime = prev + (speed === 1 ? 1 : speed === 2 ? 2 : 0.5);
        setVisibleEventsCount(events.filter((e) => e.minute <= newTime).length);

        // Stop at 90 minutes
        if (newTime >= 90) {
          setIsPlaying(false);
          return 90;
        }
        return newTime;
      });
    }, 200 / speed); // Adjust speed by changing interval

    return () => clearInterval(interval);
  }, [isPlaying, speed, events, valid]);

  if (!valid) {
    return (
      <PageShell showBack centered hideFooter>
        <div className="max-w-md space-y-4 text-center">
          <h1 className="text-2xl font-semibold">This match can't be replayed</h1>
          <p className="text-sm leading-relaxed text-ink-2">
            The broadcast needs both squads and a simulated result, and it arrived without them.
            That happens when the page is opened directly rather than reached from a simulation.
          </p>
          <button onClick={() => navigate('/')} className="btn-accent">
            Pick two teams
          </button>
        </div>
      </PageShell>
    );
  }

  const { matchResult, teamA, teamB, completeRoute, completeState, completeLabel } = state;

  const handleReset = () => {
    setCurrentTime(0);
    setVisibleEventsCount(0);
    setIsPlaying(true);
  };

  const visibleEvents = events.slice(0, visibleEventsCount);
  const currentMatchTime = Math.floor(currentTime);
  const matchStatus =
    currentMatchTime < 45 ? 'First half' : currentMatchTime < 90 ? 'Second half' : 'Full time';
  const finished = currentMatchTime >= 90;

  // Calculate score from the LAST GOAL EVENT (not commentary events)
  const lastGoalEvent = visibleEvents.filter((e) => e.type === 'goal').slice(-1)[0];
  const scoreA = lastGoalEvent?.scoreA ?? 0;
  const scoreB = lastGoalEvent?.scoreB ?? 0;

  // Extract visible goal scorers and bookings from visible events, tracking the
  // score progression to work out which side each goal belongs to.
  const visibleGoalsA: any[] = [];
  const visibleGoalsB: any[] = [];
  const visibleCardsA: any[] = [];
  const visibleCardsB: any[] = [];
  let lastScoreA = 0;
  let lastScoreB = 0;

  visibleEvents.forEach((e) => {
    if (e.type === 'goal') {
      // Try new format first, then fall back to old format
      let match = e.text.match(/GOAL! (.+?) scores!/);
      if (!match) {
        match = e.text.match(/GOAL! (.+?) scores for/);
      }
      const playerName = match ? match[1] : (e.goalScorer || e.goalScorerName || 'Unknown');
      const goal = { playerName, assist: e.assist, isPenalty: e.isPenalty, minute: e.minute };

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
        minute: e.minute,
      };
      if (e.playerTeam === 'A') visibleCardsA.push(card);
      else if (e.playerTeam === 'B') visibleCardsB.push(card);
    }
  });

  const hasSummary =
    visibleGoalsA.length > 0 || visibleGoalsB.length > 0 ||
    visibleCardsA.length > 0 || visibleCardsB.length > 0;

  const SummaryColumn: React.FC<{ goals: any[]; cards: any[]; align: 'left' | 'right' }> = ({
    goals, cards, align,
  }) => (
    <div className={`min-w-0 flex-1 space-y-1 ${align === 'right' ? 'text-right' : ''}`}>
      {goals.map((goal, idx) => (
        <p key={`g${idx}`} className="truncate text-xs text-ink-2">
          <span className="num font-semibold text-ink">{goal.minute}'</span>{' '}
          <span className="text-ink">{goal.playerName}</span>
          {goal.isPenalty && <span className="text-ink-3"> (pen)</span>}
          {goal.assist && <span className="block text-[11px] text-ink-3">Assist — {goal.assist}</span>}
        </p>
      ))}
      {cards.map((card, idx) => (
        <p
          key={`c${idx}`}
          className={`truncate text-xs ${card.cardType === 'red' ? 'text-danger' : 'text-yellow-400'}`}
        >
          <span className="num font-semibold">{card.minute}'</span> {card.playerName}
        </p>
      ))}
    </div>
  );

  const eventIcon = (event: any): IconName | null => {
    switch (event.type) {
      case 'goal': return 'ball';
      case 'card': return 'card';
      case 'skill':
        switch (event.skillType) {
          case 'save': return 'save';
          case 'tackle': return 'boot';
          case 'dribble': return 'sub';
          case 'pass': return 'right';
          default: return null;
        }
      default: return null;
    }
  };

  const eventTone = (event: any): string => {
    if (event.type === 'goal') return 'text-accent';
    if (event.type === 'card') return event.cardType === 'red' ? 'text-danger' : 'text-yellow-400';
    return 'text-ink-3';
  };

  return (
    <PageShell width="wide" showBack hideFooter>
      <div className="grid gap-block lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)]">
        <LineupColumn team={teamA} className="order-2 lg:order-1" />

        {/* Centre: the broadcast itself */}
        <div className="order-1 space-y-block lg:order-2">
          <div className="panel px-5 py-6">
            {/* Clock */}
            <div className="mb-5 flex items-center justify-center gap-3">
              {!finished && (
                <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-danger">
                  <span className="h-1.5 w-1.5 rounded-full bg-danger" />
                  Live
                </span>
              )}
              <span className="num text-2xl font-semibold text-ink">{currentMatchTime}'</span>
              <span className="eyebrow">{matchStatus}</span>
            </div>

            {/* Scoreline */}
            <div className="flex items-center gap-4">
              <div className="min-w-0 flex-1">
                <p className="display truncate text-lg md:text-xl">{teamA.name}</p>
                <p className="num text-xs text-ink-3">{teamA.year}</p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-3">
                <span className="display num text-4xl md:text-5xl">{scoreA}</span>
                <span className="text-xl text-ink-3">–</span>
                <span className="display num text-4xl md:text-5xl">{scoreB}</span>
              </div>
              <div className="min-w-0 flex-1 text-right">
                <p className="display truncate text-lg md:text-xl">{teamB.name}</p>
                <p className="num text-xs text-ink-3">{teamB.year}</p>
              </div>
            </div>

            {/* Clock as a bar — the tick marks half time */}
            <div className="relative mt-5 h-1 overflow-hidden rounded-full bg-raised">
              <div
                className="h-full bg-accent transition-[width] duration-200 ease-linear"
                style={{ width: `${(currentMatchTime / 90) * 100}%` }}
              />
              <span className="absolute left-1/2 top-0 h-full w-px bg-ground" />
            </div>

            {hasSummary && (
              <div className="mt-5 flex gap-4 border-t border-line pt-4">
                <SummaryColumn goals={visibleGoalsA} cards={visibleCardsA} align="left" />
                <SummaryColumn goals={visibleGoalsB} cards={visibleCardsB} align="right" />
              </div>
            )}
          </div>

          {/* Commentary */}
          <div className="panel p-5">
            <h2 className="rule-heading mb-3">Live commentary</h2>

            {visibleEvents.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-3">Waiting for kick-off…</p>
            ) : (
              <div className="max-h-[26rem] overflow-y-auto">
                {[...visibleEvents].reverse().map((event, idx) => {
                  const icon = eventIcon(event);
                  return (
                    <div
                      key={visibleEvents.length - idx}
                      className="flex gap-3 border-b border-line py-2.5 last:border-b-0"
                    >
                      <span className="num w-8 flex-shrink-0 pt-0.5 text-xs font-semibold text-ink-3">
                        {event.minute}'
                      </span>
                      {icon && (
                        <span className={`flex-shrink-0 pt-0.5 ${eventTone(event)}`}>
                          <Icon name={icon} size={14} />
                        </span>
                      )}
                      <p
                        className={`text-sm leading-relaxed ${
                          event.type === 'goal' ? 'font-medium text-ink' : 'text-ink-2'
                        }`}
                      >
                        {event.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Transport */}
          <div className="panel space-y-3 p-5">
            {finished && (
              <button
                onClick={() =>
                  navigate(completeRoute ?? '/result', {
                    state: completeRoute
                      ? completeState
                      : {
                          result: matchResult,
                          teamAId: teamA.id,
                          teamBId: teamB.id,
                          teamA,
                          teamB,
                        },
                  })
                }
                className="btn-accent w-full"
              >
                <Icon name="list" />
                {completeLabel ?? 'View match report'}
              </button>
            )}

            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                disabled={finished}
                className="btn-quiet btn-sm"
              >
                <Icon name={isPlaying ? 'pause' : 'play'} />
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              {[1, 2].map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  aria-pressed={speed === s}
                  className={speed === s ? 'btn-accent btn-sm' : 'btn-ghost btn-sm border border-line'}
                >
                  {s}×
                </button>
              ))}
              <button onClick={handleReset} className="btn-ghost btn-sm border border-line">
                <Icon name="reset" />
                Reset
              </button>
            </div>

            <p className="num text-center text-xs text-ink-3">
              {visibleEventsCount} of {events.length} events shown
            </p>
          </div>
        </div>

        <LineupColumn team={teamB} className="order-3" />
      </div>
    </PageShell>
  );
};
