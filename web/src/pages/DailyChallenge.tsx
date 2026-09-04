import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
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
          completeLabel: '📊 See Your Result',
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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-black via-black to-black/95">
      <Header showBack />

      <main className="flex-1 max-w-screen-md mx-auto px-4 py-12 w-full space-y-8">
        <div className="text-center space-y-2">
          <p className="text-secondary text-sm font-bold uppercase tracking-widest">
            {fixture ? `Day ${fixture.dayNumber}` : 'Daily Fixture'}
          </p>
          <h2 className="text-white text-4xl font-black tracking-tight">Predict Today's Match</h2>
          <p className="text-white/60 max-w-lg mx-auto">
            One fixture a day, the same for everyone. Lock in your prediction before kickoff — nothing
            about the result is shown until you commit.
          </p>
        </div>

        {loading && <p className="text-center text-white/60">Loading today's fixture...</p>}
        {error && <p className="text-center text-red-400">{error}</p>}

        {!loading && teamA && teamB && fixture && (
          <div className="space-y-8">
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-md">
              <div className="flex items-center justify-around text-center">
                <div>
                  <p className="text-white font-bold text-lg">{teamA.name}</p>
                  <p className="text-white/60 text-sm">{teamA.year}</p>
                </div>
                <div className="text-white/30 font-bold text-xl">vs</div>
                <div>
                  <p className="text-white font-bold text-lg">{teamB.name}</p>
                  <p className="text-white/60 text-sm">{teamB.year}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-md space-y-4">
              <h3 className="text-white font-bold text-lg">Predict the Scoreline</h3>
              <div className="flex items-center justify-center gap-6">
                <ScoreStepper label={teamA.name} value={scoreA} onChange={setScoreA} />
                <div className="text-white/40 text-2xl font-bold">—</div>
                <ScoreStepper label={teamB.name} value={scoreB} onChange={setScoreB} />
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-md space-y-4">
              <h3 className="text-white font-bold text-lg">Pick a Goalscorer</h3>
              <select
                value={scorerId}
                onChange={(e) => setScorerId(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/10 text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="" className="text-black">
                  Choose a player...
                </option>
                <optgroup label={teamA.name} className="text-black">
                  {scorerOptions.a.map((p) => (
                    <option key={p.id} value={p.id} className="text-black">
                      {p.name} ({p.position})
                    </option>
                  ))}
                </optgroup>
                <optgroup label={teamB.name} className="text-black">
                  {scorerOptions.b.map((p) => (
                    <option key={p.id} value={p.id} className="text-black">
                      {p.name} ({p.position})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <button
              onClick={handleCommit}
              disabled={!canCommit}
              className={`w-full py-4 rounded-xl font-semibold text-lg tracking-wide transition-all duration-200 ${
                canCommit
                  ? 'bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                  : 'bg-white/10 text-white/40 cursor-not-allowed'
              }`}
            >
              {starting ? '⏳ Kicking Off...' : '🔒 Lock In Prediction & Kick Off'}
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

const ScoreStepper: React.FC<{ label: string; value: number; onChange: (v: number) => void }> = ({
  label,
  value,
  onChange,
}) => (
  <div className="text-center">
    <p className="text-white/70 text-xs mb-2 max-w-[6rem] truncate">{label}</p>
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-8 h-8 rounded-full bg-white/10 text-white font-bold hover:bg-white/20 transition"
      >
        −
      </button>
      <span className="text-white text-3xl font-bold w-8 text-center">{value}</span>
      <button
        onClick={() => onChange(Math.min(9, value + 1))}
        className="w-8 h-8 rounded-full bg-white/10 text-white font-bold hover:bg-white/20 transition"
      >
        +
      </button>
    </div>
  </div>
);
