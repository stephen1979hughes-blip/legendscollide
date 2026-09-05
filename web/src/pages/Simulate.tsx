import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Icon } from '../components/Icon';
import { api } from '../services/api';

const STEPS = ['Generating chances', 'Calculating possession', 'Resolving key events'];

export const Simulate: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { teamAId, teamBId } = location.state || {};
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamAId || !teamBId) {
      navigate('/');
      return;
    }

    const runSimulation = async () => {
      try {
        for (let i = 0; i < STEPS.length; i++) {
          setStep(i);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        setStep(STEPS.length);

        const matchResult = await api.simulateMatch(teamAId, teamBId, false);
        const teamA = await api.getTeam(teamAId);
        const teamB = await api.getTeam(teamBId);

        setTimeout(() => {
          navigate('/broadcast', { state: { matchResult, teamA, teamB } });
        }, 400);
      } catch (err) {
        console.error('Simulation failed:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    runSimulation();
  }, [teamAId, teamBId, navigate]);

  if (error) {
    return (
      <PageShell showBack centered hideFooter>
        <div className="max-w-md space-y-4 text-center">
          <h1 className="text-2xl font-semibold">The match didn't run</h1>
          <p className="text-sm leading-relaxed text-ink-2">{error}</p>
          <button onClick={() => navigate('/')} className="btn-accent">
            Pick two teams again
          </button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell centered hideFooter>
      <div className="w-full max-w-xs space-y-8">
        <div className="flex justify-center">
          <span className="h-12 w-12 animate-spin rounded-full border-2 border-line border-t-accent" />
        </div>

        <div className="space-y-1 text-center">
          <p className="eyebrow">Kick-off</p>
          <h1 className="text-2xl font-semibold">Simulating match</h1>
        </div>

        <ol className="space-y-1">
          {STEPS.map((label, idx) => {
            const done = step > idx;
            const active = step === idx;
            return (
              <li
                key={label}
                className={`flex items-center gap-3 rounded-ctl px-3 py-2.5 text-sm transition-colors duration-200 ${
                  active ? 'bg-raised text-ink' : done ? 'text-ink-2' : 'text-ink-3'
                }`}
              >
                <span className={done ? 'text-accent' : 'text-ink-3'}>
                  {done ? (
                    <Icon name="check" size={15} />
                  ) : (
                    <span className="block h-[15px] w-[15px] rounded-full border border-current" />
                  )}
                </span>
                {label}
              </li>
            );
          })}
        </ol>
      </div>
    </PageShell>
  );
};
