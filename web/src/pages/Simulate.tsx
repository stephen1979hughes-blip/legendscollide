import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Header } from '../components/Header';
import { api } from '../services/api';
import { MatchResult } from '../types';

export const Simulate: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { teamAId, teamBId } = location.state || {};
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const steps = [
    'Generating chances...',
    'Calculating possession...',
    'Resolving key events...',
  ];

  useEffect(() => {
    if (!teamAId || !teamBId) {
      navigate('/');
      return;
    }

    const runSimulation = async () => {
      try {
        for (let i = 0; i < steps.length; i++) {
          setStep(i);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        const matchResult = await api.simulateMatch(teamAId, teamBId, false);
        console.log('Match result:', matchResult);

        // Fetch full team data for broadcast
        const teamA = await api.getTeam(teamAId);
        const teamB = await api.getTeam(teamBId);

        setResult(matchResult);
        setTimeout(() => {
          navigate('/broadcast', {
            state: {
              matchResult,
              teamA,
              teamB
            }
          });
        }, 500);
      } catch (error) {
        console.error('Simulation failed:', error);
        setError(`Simulation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    runSimulation();
  }, [teamAId, teamBId, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="text-center">
          {error ? (
            <div>
              <h1 className="text-3xl font-heading font-bold text-red-600 mb-4">
                Simulation Error
              </h1>
              <p className="text-text mb-6">{error}</p>
              <button
                onClick={() => navigate('/')}
                className="btn-primary"
              >
                Back to Home
              </button>
            </div>
          ) : (
            <>
              <div className="mb-8 flex justify-center">
                <div className="w-16 h-16 rounded-full border-4 border-primary border-t-secondary animate-spin"></div>
              </div>

              <h1 className="text-4xl font-heading font-bold text-primary mb-6">
                Simulating Match...
              </h1>

              <div className="space-y-3">
                {steps.map((s, idx) => (
                  <div
                    key={idx}
                    className={`text-lg transition ${
                      step >= idx ? 'text-primary font-semibold' : 'text-muted'
                    }`}
                  >
                    {step > idx ? '✓' : '○'} {s}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};
