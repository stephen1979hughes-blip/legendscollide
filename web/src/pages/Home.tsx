import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { TeamSelectCard } from '../components/TeamSelectCard';
import { Icon, IconName } from '../components/Icon';
import { api } from '../services/api';
import { TeamSummary, Team } from '../types';

/**
 * The two secondary modes. They used to be two separately hand-built gradient
 * banners with the same content shape but different markup; they're one
 * component rendered twice now, which is why they line up.
 */
const MODES: { icon: IconName; eyebrow: string; title: string; blurb: string; cta: string; path: string }[] = [
  {
    icon: 'bolt',
    eyebrow: 'Daily fixture',
    title: 'One match. Every day. Everyone.',
    blurb: "Predict today's scoreline and scorer before kickoff, then watch it play out. Same fixture for the whole world.",
    cta: "Play today's fixture",
    path: '/daily',
  },
  {
    icon: 'map',
    eyebrow: 'Campaign',
    title: 'Build a collection. Climb the ladder.',
    blurb: 'Earn tokens, open packs, level up your cards, and work your way up all 26 classic teams.',
    cta: 'Start campaign',
    path: '/campaign',
  },
];

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [teamAId, setTeamAId] = useState<string>('');
  const [teamBId, setTeamBId] = useState<string>('');
  const [teamA, setTeamA] = useState<Team | null>(null);
  const [teamB, setTeamB] = useState<Team | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTeams = async () => {
      try {
        setTeams(await api.getTeams());
      } catch (err) {
        console.error('Failed to load teams:', err);
        setTeams([]);
        setError('Could not load the team list. Refresh to try again.');
      }
    };
    loadTeams();
  }, []);

  const selectTeam = async (side: 'a' | 'b', team: TeamSummary) => {
    try {
      setError(null);
      if (side === 'a') setTeamAId(team.id);
      else setTeamBId(team.id);
      const full = await api.getTeam(team.id);
      if (side === 'a') setTeamA(full);
      else setTeamB(full);
    } catch (err) {
      console.error(`Failed to load team ${team.id}:`, err);
      setError(`Could not load ${team.name}. Pick it again, or choose another side.`);
    }
  };

  const ready = Boolean(teamAId && teamBId && teamA && teamB);

  const handleSimulate = () => {
    if (!ready) return;
    setLoading(true);
    navigate('/simulate', { state: { teamAId, teamBId } });
  };

  return (
    <PageShell>
      <div className="space-y-section">
        {/* Secondary modes */}
        <div className="grid gap-block sm:grid-cols-2">
          {MODES.map((mode) => (
            <div key={mode.path} className="card flex flex-col gap-3">
              <div className="flex items-center gap-2 text-accent">
                <Icon name={mode.icon} size={15} />
                <span className="eyebrow text-accent">{mode.eyebrow}</span>
              </div>
              <div className="flex-1 space-y-1.5">
                <h2 className="text-lg font-semibold leading-snug md:text-xl">{mode.title}</h2>
                <p className="text-sm leading-relaxed text-ink-2">{mode.blurb}</p>
              </div>
              <button onClick={() => navigate(mode.path)} className="btn-quiet btn-sm self-start">
                {mode.cta}
                <Icon name="right" />
              </button>
            </div>
          ))}
        </div>

        {/* The main event */}
        <section className="space-y-block">
          <div className="space-y-1.5 border-b border-line pb-5">
            <p className="eyebrow">Exhibition match</p>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Select your teams</h1>
            <p className="max-w-[60ch] text-[15px] leading-relaxed text-ink-2">
              Two legendary squads, ninety simulated minutes, and full commentary. Brazil 1970
              against Germany 2014, or any of the other 26 sides.
            </p>
          </div>

          {error && (
            <p className="rounded-ctl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </p>
          )}

          <div className="grid gap-block md:grid-cols-2">
            <TeamSelectCard
              label="Home"
              teams={teams}
              selectedTeam={teams.find((t) => t.id === teamAId) || null}
              onSelect={(team) => selectTeam('a', team)}
            />
            <TeamSelectCard
              label="Away"
              teams={teams}
              selectedTeam={teams.find((t) => t.id === teamBId) || null}
              onSelect={(team) => selectTeam('b', team)}
            />
          </div>

          <div className="flex flex-col items-center gap-3 pt-2">
            <button
              onClick={handleSimulate}
              disabled={!ready || loading}
              className="btn-accent btn-lg w-full md:w-auto md:min-w-[280px]"
            >
              <Icon name="ball" size={17} />
              {loading ? 'Starting…' : 'Simulate match'}
            </button>
            <p className="text-sm text-ink-3">
              {ready ? 'Watch it unfold minute by minute' : 'Pick both sides to begin'}
            </p>
          </div>
        </section>

        {/* Custom XI */}
        <section className="panel flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <p className="eyebrow">Create your fantasy</p>
            <h2 className="text-lg font-semibold md:text-xl">Build your all-time XI</h2>
            <p className="max-w-[52ch] text-sm leading-relaxed text-ink-2">
              Hand-pick players from across history to create your perfect squad and test their
              mettle against any classic side.
            </p>
          </div>
          <button
            onClick={() => navigate('/custom-xi')}
            className="btn-quiet flex-shrink-0"
          >
            <Icon name="sparkle" />
            Build custom XI
          </button>
        </section>
      </div>
    </PageShell>
  );
};
