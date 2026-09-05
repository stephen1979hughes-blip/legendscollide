import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Icon } from '../components/Icon';
import { api } from '../services/api';
import { getDailyFixture } from '../utils/dailyFixture';
import { dailyChallengeStorage } from '../utils/dailyChallengeStorage';
import { DailyFixture } from '../types/daily';
import { Team } from '../types';

const positionOrder: Record<string, number> = { GK: 0, DF: 1, MF: 2, FW: 3 };
const sortedSquad = (team: Team) =>
  [...team.players].sort((a, b) => (positionOrder[a.position] ?? 9) - (positionOrder[b.position] ?? 9));

export const DailyChallenge: React.FC = () => {
  const navigate = useNavigate();
  const [fixture, setFixture] = useState<DailyFixture | null>(null);
  const [teamA, setTeamA] = useState<Team | null>(null);
  const [teamB, setTeamB] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [scoreA, setScoreA] = useState(1);
  const [scoreB, setScoreB] = useState(1);
  const [scorerId, setScorerId] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const fx = await getDailyFixture();
        if (cancelled) return;

        // Already played today — nothing left to predict, go straight to the recap.
        if (dailyChallengeStorage.hasRecord(fx.dayNumber)) {
          navigate('/daily/result', { replace: true });
          return;
        }

        setFixture(fx);
        const [a, b] = await Promise.all([api.getTeam(fx.teamAId), api.getTeam(fx.teamBId)]);
        if (cancelled) return;
        setTeamA(a);
        setTeamB(b);
      } catch (e) {
        if (!cancelled) {
          console.error('Failed to load daily fixture:', e);
          setError("Couldn't load today's fixture.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const scorerOptions = useMemo(() => {
    if (!teamA || !teamB) return { a: [], b: [] };
    return { a: sortedSquad(teamA), b: sortedSquad(teamB) };
  }, [teamA, teamB]);

  const canCommit = !!fixture && !!teamA && !!teamB && !!scorerId && !starting;

  const handleCommit = async () => {
    if (!fixture || !teamA || !teamB || !scorerId) return;
    const scorer =
      teamA.players.find((p) => p.id === scorerId) ?? teamB.players.find((p) => p.id === scorerId);
    if (!scorer) return;
    const scorerTeam: 'A' | 'B' = teamA.players.some((p) => p.id === scorerId) ? 'A' : 'B';

    setStarting(true);
    try {
      // Only computed now, after the prediction is locked in — nothing about
      // the result exists anywhere before this point.
      const matchResult = await api.simulateMatch(
        fixture.teamAId,
        fixture.teamBId,
        false,
        undefined,
        undefined,
        fixture.seed
      );

      navigate('/broadcast', {
        state: {
          matchResult,
          teamA,
          teamB,
          completeRoute: '/daily/result',
          completeLabel: 'See your result',
          completeState: {
            matchResult,
            teamA,
            teamB,
            fixture,
            prediction: {
              scoreA,
              scoreB,
              scorerId,
              scorerName: scorer.name,
              scorerTeam,
            },
          },
        },
      });
    } catch (e) {
      console.error('Failed to start the daily match:', e);
      setError('Something went wrong starting the match.');
      setStarting(false);
    }
  };

  return (
    <PageShell width="narrow" showBack>
      <div className="space-y-section">
        <div className="space-y-1.5 border-b border-line pb-5">
          <p className="eyebrow">{fixture ? `Day ${fixture.dayNumber}` : 'Daily fixture'}</p>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Predict today's match</h1>
          <p className="max-w-[60ch] text-[15px] leading-relaxed text-ink-2">
            One fixture a day, the same for everyone. Lock in your prediction before kickoff —
            nothing about the result is shown until you commit.
          </p>
        </div>

        {loading && <p className="text-center text-sm text-ink-3">Loading today's fixture…</p>}
        {error && (
          <p className="rounded-ctl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}

        {!loading && teamA && teamB && fixture && (
          <div className="space-y-block">
            <div className="panel flex items-center gap-4 px-5 py-5">
              <div className="min-w-0 flex-1">
                <p className="display truncate text-lg">{teamA.name}</p>
                <p className="num text-xs text-ink-3">{teamA.year}</p>
              </div>
              <span className="eyebrow flex-shrink-0">vs</span>
              <div className="min-w-0 flex-1 text-right">
                <p className="display truncate text-lg">{teamB.name}</p>
                <p className="num text-xs text-ink-3">{teamB.year}</p>
              </div>
            </div>

            <div className="card space-y-4">
              <h2 className="rule-heading">Predict the scoreline</h2>
              <div className="flex items-center justify-center gap-5">
                <ScoreStepper label={teamA.name} value={scoreA} onChange={setScoreA} />
                <span className="pt-6 text-xl text-ink-3">–</span>
                <ScoreStepper label={teamB.name} value={scoreB} onChange={setScoreB} />
              </div>
            </div>

            <div className="card space-y-3">
              <h2 className="rule-heading">Pick a goalscorer</h2>
              <select
                value={scorerId}
                onChange={(e) => setScorerId(e.target.value)}
                className="field"
              >
                <option value="">Choose a player…</option>
                <optgroup label={teamA.name}>
                  {scorerOptions.a.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.position})
                    </option>
                  ))}
                </optgroup>
                <optgroup label={teamB.name}>
                  {scorerOptions.b.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.position})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <button onClick={handleCommit} disabled={!canCommit} className="btn-accent btn-lg w-full">
              <Icon name="lock" />
              {starting ? 'Kicking off…' : 'Lock in prediction and kick off'}
            </button>
          </div>
        )}
      </div>
    </PageShell>
  );
};

const ScoreStepper: React.FC<{ label: string; value: number; onChange: (v: number) => void }> = ({
  label,
  value,
  onChange,
}) => (
  <div className="space-y-2 text-center">
    <p className="mx-auto max-w-[7rem] truncate text-xs text-ink-3">{label}</p>
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(Math.max(0, value - 1))}
        aria-label={`Fewer goals for ${label}`}
        className="inset flex h-8 w-8 items-center justify-center text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
      >
        −
      </button>
      <span className="num display w-9 text-center text-3xl">{value}</span>
      <button
        onClick={() => onChange(Math.min(9, value + 1))}
        aria-label={`More goals for ${label}`}
        className="inset flex h-8 w-8 items-center justify-center text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
      >
        +
      </button>
    </div>
  </div>
);